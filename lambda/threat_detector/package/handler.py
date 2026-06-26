import json
import uuid
import boto3
import os
from datetime import datetime, timezone
from rules import match_event, extract_event_context

# AWS clients — reused across warm invocations
dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
sns      = boto3.client("sns",       region_name=os.environ.get("AWS_REGION", "us-east-1"))

THREATS_TABLE   = os.environ.get("THREATS_TABLE",   "soc_threats")
INCIDENTS_TABLE = os.environ.get("INCIDENTS_TABLE", "soc_incidents")
SNS_TOPIC_ARN   = os.environ.get("SNS_TOPIC_ARN",   "")


def lambda_handler(event, context):
    """
    Entry point. Triggered by CloudWatch EventBridge rule.
    event["detail"] contains the raw CloudTrail event.
    """
    print(f"[SOC] Lambda triggered | RequestId: {context.aws_request_id}")

    try:
        detail     = event.get("detail", {})
        event_name = detail.get("eventName", "")

        if not event_name:
            print("[SOC] No eventName found — skipping")
            return {"statusCode": 200, "body": "no_event_name"}

        print(f"[SOC] Processing event: {event_name}")

        # Match against threat rules
        matched_rule = match_event(event_name, detail)
        if not matched_rule:
            print(f"[SOC] No rule matched for: {event_name}")
            return {"statusCode": 200, "body": "no_match"}

        # Extract context
        ctx = extract_event_context(detail)

        # Build threat record
        threat_id   = f"THR-{uuid.uuid4().hex[:8].upper()}"
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        now         = datetime.now(timezone.utc).isoformat()

        threat_item = {
            "threat_id":       threat_id,
            "event_type":      matched_rule["event_type"],
            "severity":        matched_rule["severity"],
            "risk_score":      matched_rule["risk_score"],
            "source_ip":       ctx["source_ip"],
            "username":        ctx["username"],
            "timestamp":       now,
            "status":          "OPEN",
            "description":     matched_rule["description"],
            "region":          ctx["region"],
            "resource_id":     ctx["resource_id"],
            "user_agent":      ctx["user_agent"],
            "raw_event_name":  event_name,
            "recommendations": get_recommendations(matched_rule["severity"]),
            "ai_analysis":     get_ai_analysis(
                matched_rule["event_type"],
                matched_rule["severity"],
                matched_rule["risk_score"]
            ),
        }

        incident_item = {
            "incident_id": incident_id,
            "threat_id":   threat_id,
            "status":      "OPEN",
            "severity":    matched_rule["severity"],
            "event_type":  matched_rule["event_type"],
            "assigned_to": None,
            "notes":       "",
            "created_at":  now,
            "updated_at":  now,
        }

        # Write to DynamoDB
        threats_table   = dynamodb.Table(THREATS_TABLE)
        incidents_table = dynamodb.Table(INCIDENTS_TABLE)

        threats_table.put_item(Item=threat_item)
        print(f"[SOC] Threat written: {threat_id}")

        incidents_table.put_item(Item=incident_item)
        print(f"[SOC] Incident written: {incident_id}")

        # Send SNS for CRITICAL and HIGH
        if matched_rule["severity"] in ("CRITICAL", "HIGH") and SNS_TOPIC_ARN:
            send_sns_alert(threat_item, incident_id)

        return {
            "statusCode": 200,
            "body": json.dumps({
                "threat_id":   threat_id,
                "incident_id": incident_id,
                "severity":    matched_rule["severity"],
                "event_type":  matched_rule["event_type"]
            })
        }

    except Exception as e:
        print(f"[SOC] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"statusCode": 500, "body": str(e)}


def send_sns_alert(threat: dict, incident_id: str):
    subject = f"[SOC ALERT] {threat['severity']} — {threat['event_type']}"
    message = f"""
╔══════════════════════════════════════════╗
  AWS CLOUD SOC — SECURITY ALERT
╚══════════════════════════════════════════╝

Severity   : {threat['severity']}
Risk Score : {threat['risk_score']}/100
Event      : {threat['event_type']}
Threat ID  : {threat['threat_id']}
Incident   : {incident_id}

Who        : {threat['username']}
Source IP  : {threat['source_ip']}
Region     : {threat['region']}
Time (UTC) : {threat['timestamp']}

Description:
{threat['description']}

AI Analysis:
{threat.get('ai_analysis', 'N/A')}

Recommended Actions:
{chr(10).join(f'  • {r}' for r in threat.get('recommendations', []))}

──────────────────────────────────────────
AWS Cloud SOC Platform — Automated Alert
    """
    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],
            Message=message
        )
        print(f"[SOC] SNS alert sent for {threat['threat_id']}")
    except Exception as e:
        print(f"[SOC] SNS publish failed: {e}")


def get_recommendations(severity: str) -> list:
    base = {
        "CRITICAL": [
            "Immediately investigate this event",
            "Rotate all credentials",
            "Enable MFA on all accounts",
            "Review CloudTrail for correlated events in last 24 hours",
            "Consider isolating affected resources"
        ],
        "HIGH": [
            "Review IAM permissions and apply least privilege",
            "Check for unauthorized policy changes",
            "Enable AWS Config to track changes",
            "Notify senior SOC analyst"
        ],
        "MEDIUM": [
            "Monitor source IP for further activity",
            "Verify action was performed by authorized user",
            "Review access logs"
        ],
        "LOW": [
            "Log for audit purposes",
            "Ensure resource follows tagging policies"
        ]
    }
    return base.get(severity, ["Review and investigate"])


def get_ai_analysis(event_type: str, severity: str, score: int) -> str:
    templates = {
        "ConsoleLogin_Root":
            f"Root account login detected (risk {score}/100). Root logins should never "
            "occur in a governed AWS account. This strongly indicates compromised root "
            "credentials or an insider threat. Immediate response required.",
        "AttachUserPolicy_Admin":
            f"Privilege escalation vector detected (risk {score}/100). Attaching "
            "AdministratorAccess to an IAM user grants unrestricted AWS access. "
            "This is a critical control failure if unauthorized.",
        "AttachRolePolicy_Admin":
            f"Role privilege escalation detected (risk {score}/100). An IAM role now "
            "has administrator access. Review all services and users assuming this role.",
        "DeleteSecurityGroup":
            f"Network security control removed (risk {score}/100). Security group "
            "deletion may expose resources to unauthorized network access. "
            "Validate the current security posture immediately.",
        "StopLogging":
            f"Audit evasion attempt detected (risk {score}/100). Disabling CloudTrail "
            "is a known attacker technique to hide malicious activity. "
            "This event itself may be the only record of ongoing attack activity.",
        "DeleteTrail":
            f"Complete audit trail destroyed (risk {score}/100). All subsequent "
            "AWS API activity will be unlogged. Treat as active breach scenario.",
        "CreateUser":
            f"New IAM principal created (risk {score}/100). Unauthorized user creation "
            "is a persistence technique used by attackers to maintain access. "
            "Verify through your HR and IT onboarding records.",
        "CreateAccessKey":
            f"New long-term credential created (risk {score}/100). Access keys provide "
            "programmatic AWS access without MFA. Monitor the key for unusual API calls.",
    }
    return templates.get(
        event_type,
        f"Security event '{event_type}' detected with risk score {score}/100 "
        f"(severity: {severity}). Correlate with other events from the same "
        "source IP and user to determine if this is part of an attack chain."
    )