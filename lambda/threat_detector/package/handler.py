import json
import uuid
import boto3
import os
import time
import traceback
from datetime import datetime, timezone
from botocore.exceptions import ClientError
from rules import match_event, get_default_threat, extract_event_context

# ── AWS Clients ────────────────────────────────────────────
_region  = os.environ.get("AWS_REGION", "ap-south-2")
dynamodb = boto3.resource("dynamodb", region_name=_region)
sns      = boto3.client("sns",        region_name=_region)

# ── Table Names ────────────────────────────────────────────
THREATS_TABLE    = os.environ.get("THREATS_TABLE",    "soc_threats")
INCIDENTS_TABLE  = os.environ.get("INCIDENTS_TABLE",  "soc_incidents")
AUDIT_LOGS_TABLE = os.environ.get("AUDIT_LOGS_TABLE", "soc_audit_logs")
SNS_TOPIC_ARN    = os.environ.get("SNS_TOPIC_ARN",    "")

# ── Skip high-volume read-only events ──────────────────────
IGNORED_EVENTS = {
    "AssumeRoleWithWebIdentity", "AssumeRoleWithSAML",
    "GetObject", "HeadObject", "HeadBucket",
    "ListObjectsV2", "ListObjects", "ListObjectVersions",
    "GetBucketLocation", "GetBucketVersioning",
    "GetBucketPolicy", "GetBucketAcl", "GetBucketTagging",
    "GetAccountAuthorizationDetails",
    "GenerateDataKey", "GenerateDataKeyWithoutPlaintext", "Decrypt",
    "DescribeLogGroups", "DescribeLogStreams",
    "GetLogEvents", "FilterLogEvents", "DescribeMetricFilters",
    "ListTagsForResource", "ListTagsLogGroup",
    "GetResources", "ListResourceRecordSets",
    "DescribeAvailabilityZones", "DescribeRegions",
    "DescribeAccountAttributes", "GetSendQuota",
    "DescribeInstanceStatus", "DescribeInstanceAttribute",
    "ListBuckets",  # too noisy — caught by rule anyway
}


def put_item_with_retry(table_name: str, item: dict, max_retries: int = 3) -> bool:
    """
    Write to DynamoDB with exponential backoff retry.
    Returns True on success, False after all retries exhausted.
    """
    table = dynamodb.Table(table_name)
    for attempt in range(max_retries):
        try:
            table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(#pk)",
                ExpressionAttributeNames={"#pk": list(item.keys())[0]}
            )
            return True
        except ClientError as e:
            code = e.response["Error"]["Code"]
            if code == "ConditionalCheckFailedException":
                # Duplicate event — silently skip
                print(f"[SOC] Duplicate item skipped for {table_name}: {list(item.values())[0]}")
                return True
            elif code in ("ProvisionedThroughputExceededException", "RequestLimitExceeded", "ThrottlingException"):
                wait = (2 ** attempt) * 0.5
                print(f"[SOC] Throttled on {table_name}, retrying in {wait}s (attempt {attempt+1}/{max_retries})")
                time.sleep(wait)
            else:
                print(f"[SOC] DynamoDB error on {table_name}: {code} — {e.response['Error']['Message']}")
                if attempt == max_retries - 1:
                    return False
                time.sleep(0.5)
        except Exception as e:
            print(f"[SOC] Unexpected error writing to {table_name}: {str(e)}")
            if attempt == max_retries - 1:
                return False
            time.sleep(0.5)
    return False


def lambda_handler(event, context):
    print(f"[SOC] ===== Invoked | RequestId: {context.aws_request_id} =====")

    try:
        # ── Parse CloudTrail event from EventBridge envelope ──
        detail     = event.get("detail", {})
        event_name = detail.get("eventName", "")

        if not event_name:
            print(f"[SOC] No eventName found. Event keys: {list(event.keys())}")
            print(f"[SOC] Detail keys: {list(detail.keys())}")
            return {"statusCode": 200, "body": "no_event_name"}

        print(f"[SOC] EventName: {event_name} | Source: {detail.get('eventSource','?')}")

        # ── Skip noisy events ─────────────────────────────────
        if event_name in IGNORED_EVENTS:
            print(f"[SOC] Skipping: {event_name}")
            return {"statusCode": 200, "body": f"ignored:{event_name}"}

        # ── Extract context ───────────────────────────────────
        ctx = extract_event_context(detail)
        now = datetime.now(timezone.utc).isoformat()

        # Use CloudTrail's own eventID to deduplicate
        ct_event_id = detail.get("eventID", str(uuid.uuid4()))

        print(f"[SOC] Actor: {ctx['username']} | IP: {ctx['source_ip']} | Region: {ctx['region']}")

        # ─────────────────────────────────────────────────────
        # STEP 1: Write raw event to soc_audit_logs
        # Every CloudTrail event is stored here first
        # ─────────────────────────────────────────────────────
        log_id = f"LOG-{ct_event_id[:8].upper()}"

        identity = detail.get("userIdentity", {})
        audit_item = {
            "log_id":              log_id,
            "event_id":            ct_event_id,
            "action":              event_name,
            "timestamp":           now,
            "event_time":          detail.get("eventTime", now),
            "user":                ctx["username"],
            "source_ip":           ctx["source_ip"],
            "region":              ctx["region"],
            "event_source":        ctx["event_source"],
            "user_agent":          ctx["user_agent"],
            "account_id":          identity.get("accountId", "unknown"),
            "user_type":           identity.get("type", "unknown"),
            "user_arn":            identity.get("arn", "unknown"),
            "aws_region":          detail.get("awsRegion", ctx["region"]),
            "request_parameters":  json.dumps(detail.get("requestParameters") or {})[:1000],
            "response_elements":   json.dumps(detail.get("responseElements") or {})[:1000],
            "error_code":          detail.get("errorCode", ""),
            "error_message":       detail.get("errorMessage", ""),
            "resources":           json.dumps(detail.get("resources") or [])[:500],
            "read_only":           str(detail.get("readOnly", False)),
        }

        audit_ok = put_item_with_retry(AUDIT_LOGS_TABLE, audit_item)
        if audit_ok:
            print(f"[SOC] ✅ Audit log: {log_id}")
        else:
            print(f"[SOC] ⚠️  Audit log failed (non-fatal): {log_id}")

        # ─────────────────────────────────────────────────────
        # STEP 2: Match threat rules
        # ─────────────────────────────────────────────────────
        matched_rule = match_event(event_name, detail)

        if not matched_rule:
            print(f"[SOC] No specific rule for '{event_name}' — applying default LOW")
            matched_rule = get_default_threat(event_name, detail)

        print(f"[SOC] Rule: {matched_rule['event_type']} | {matched_rule['severity']} | Score: {matched_rule['risk_score']}")

        # ─────────────────────────────────────────────────────
        # STEP 3: Write threat to soc_threats
        # ─────────────────────────────────────────────────────
        threat_id = f"THR-{ct_event_id[:8].upper()}"

        threat_item = {
            "threat_id":        threat_id,
            "event_type":       matched_rule["event_type"],
            "severity":         matched_rule["severity"],
            "risk_score":       matched_rule["risk_score"],
            "source_ip":        ctx["source_ip"],
            "username":         ctx["username"],
            "timestamp":        now,
            "event_time":       detail.get("eventTime", now),
            "status":           "OPEN",
            "description":      matched_rule["description"],
            "region":           ctx["region"],
            "resource_id":      ctx["resource_id"],
            "user_agent":       ctx["user_agent"],
            "event_source":     ctx["event_source"],
            "raw_event_name":   event_name,
            "event_id":         ct_event_id,
            "mitre":            matched_rule.get("mitre", ""),
            "recommendations":  matched_rule.get("recommendations", []),
            "ai_analysis":      matched_rule.get("ai_analysis", ""),
            "audit_log_id":     log_id,
            "account_id":       identity.get("accountId", "unknown"),
            "user_arn":         identity.get("arn", "unknown"),
            "error_code":       detail.get("errorCode", ""),
        }

        threat_ok = put_item_with_retry(THREATS_TABLE, threat_item)
        if not threat_ok:
            print(f"[SOC] ❌ CRITICAL: Could not write threat {threat_id} after retries")
            return {"statusCode": 500, "body": f"failed_to_write_threat:{threat_id}"}

        print(f"[SOC] ✅ Threat: {threat_id}")

        # ─────────────────────────────────────────────────────
        # STEP 4: Auto-create incident for HIGH and CRITICAL
        # ─────────────────────────────────────────────────────
        incident_id = None

        if matched_rule["severity"] in ("CRITICAL", "HIGH"):
            incident_id = f"INC-{ct_event_id[:8].upper()}"

            incident_item = {
                "incident_id":      incident_id,
                "threat_id":        threat_id,
                "status":           "OPEN",
                "severity":         matched_rule["severity"],
                "event_type":       matched_rule["event_type"],
                "raw_event_name":   event_name,
                "assigned_to":      None,
                "notes":            "",
                "resolution_notes": "",
                "created_at":       now,
                "updated_at":       now,
                "resolved_at":      None,
                "username":         ctx["username"],
                "source_ip":        ctx["source_ip"],
                "region":           ctx["region"],
                "resource_id":      ctx["resource_id"],
                "mitre":            matched_rule.get("mitre", ""),
                "ai_analysis":      matched_rule.get("ai_analysis", ""),
                "description":      matched_rule["description"],
                "risk_score":       matched_rule["risk_score"],
                "account_id":       identity.get("accountId", "unknown"),
            }

            incident_ok = put_item_with_retry(INCIDENTS_TABLE, incident_item)
            if incident_ok:
                print(f"[SOC] ✅ Incident: {incident_id}")
            else:
                print(f"[SOC] ⚠️  Incident write failed: {incident_id}")
                incident_id = None

            # ── SNS Alert ─────────────────────────────────────
            if SNS_TOPIC_ARN:
                _send_sns(threat_item, incident_id or "FAILED")

        # ── Return success ────────────────────────────────────
        result = {
            "threat_id":   threat_id,
            "incident_id": incident_id,
            "severity":    matched_rule["severity"],
            "event_type":  matched_rule["event_type"],
            "event_name":  event_name,
            "audit_log":   log_id,
        }
        print(f"[SOC] ===== Done: {json.dumps(result)} =====")
        return {"statusCode": 200, "body": json.dumps(result)}

    except Exception as e:
        print(f"[SOC] FATAL: {str(e)}")
        traceback.print_exc()
        return {"statusCode": 500, "body": str(e)}


def _send_sns(threat: dict, incident_id: str):
    subject = f"[SOC {threat['severity']}] {threat['event_type']} — Risk {threat['risk_score']}/100"
    message = f"""
╔════════════════════════════════════════════════════╗
    AWS CLOUD SOC — SECURITY ALERT
╚════════════════════════════════════════════════════╝

SEVERITY   : {threat['severity']}
RISK SCORE : {threat['risk_score']}/100
EVENT TYPE : {threat['event_type']}
RAW EVENT  : {threat.get('raw_event_name', 'N/A')}
MITRE      : {threat.get('mitre', 'N/A')}

THREAT ID  : {threat['threat_id']}
INCIDENT   : {incident_id}
AUDIT LOG  : {threat.get('audit_log_id', 'N/A')}

ACTOR      : {threat['username']}
SOURCE IP  : {threat['source_ip']}
REGION     : {threat['region']}
ACCOUNT    : {threat.get('account_id', 'N/A')}
TIME (UTC) : {threat['timestamp']}

DESCRIPTION:
{threat['description']}

AI ANALYSIS:
{threat.get('ai_analysis', 'N/A')}

RECOMMENDED ACTIONS:
{chr(10).join(f'  • {r}' for r in threat.get('recommendations', []))}

────────────────────────────────────────────────────
AWS Cloud SOC Platform — Automated Detection
ap-south-2 — Hyderabad
    """
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],
            Message=message
        )
        print(f"[SOC] ✅ SNS sent for {threat['threat_id']}")
    except Exception as e:
        print(f"[SOC] ⚠️  SNS failed: {str(e)}")