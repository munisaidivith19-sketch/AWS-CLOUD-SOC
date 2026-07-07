import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from datetime import datetime, timezone
from utils.logger import get_logger
import os

logger = get_logger(__name__)

def get_boto_client(service: str):
    return boto3.client(
        service,
        region_name=os.getenv("AWS_REGION", "ap-south-2"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

def get_boto_resource(service: str):
    return boto3.resource(
        service,
        region_name=os.getenv("AWS_REGION", "ap-south-2"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
    )

class AWSInventoryService:
    """
    Discovers real AWS resources from your account using boto3.
    No seed data. No mock data. Everything comes directly from AWS.
    """

    def discover_all_assets(self) -> list:
        """
        Calls every AWS service and returns a unified list of real resources.
        """
        assets = []
        now = datetime.now(timezone.utc).isoformat()

        # ── IAM Users ──────────────────────────────────────────────
        try:
            iam = get_boto_client("iam")
            users = iam.list_users().get("Users", [])
            for u in users:
                assets.append({
                    "resource_id":   u["UserId"],
                    "resource_name": u["UserName"],
                    "resource_type": "IAM_USER",
                    "status":        "ACTIVE",
                    "region":        "global",
                    "arn":           u.get("Arn", ""),
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra": {
                        "created": str(u.get("CreateDate", "")),
                        "path":    u.get("Path", "/")
                    }
                })
            logger.info(f"IAM: discovered {len(users)} users")
        except Exception as e:
            logger.warning(f"IAM discovery failed: {e}")

        # ── EC2 Instances ───────────────────────────────────────────
        try:
            ec2 = get_boto_client("ec2")
            resp = ec2.describe_instances()
            for reservation in resp.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    name = "unnamed"
                    for tag in instance.get("Tags", []):
                        if tag["Key"] == "Name":
                            name = tag["Value"]
                    state = instance.get("State", {}).get("Name", "unknown").upper()
                    assets.append({
                        "resource_id":   instance["InstanceId"],
                        "resource_name": name,
                        "resource_type": "EC2",
                        "status":        state,
                        "region":        os.getenv("AWS_REGION", "ap-south-2"),
                        "arn":           f"arn:aws:ec2:{os.getenv('AWS_REGION')}:{instance.get('OwnerId','')}:instance/{instance['InstanceId']}",
                        "last_seen":     now,
                        "threat_count":  0,
                        "tags":          {t["Key"]: t["Value"] for t in instance.get("Tags", [])},
                        "extra": {
                            "instance_type": instance.get("InstanceType", ""),
                            "public_ip":     instance.get("PublicIpAddress", "N/A"),
                            "private_ip":    instance.get("PrivateIpAddress", "N/A"),
                        }
                    })
            logger.info(f"EC2: discovered {len(assets)} instances")
        except Exception as e:
            logger.warning(f"EC2 discovery failed: {e}")

        # ── Lambda Functions ────────────────────────────────────────
        try:
            lmb = get_boto_client("lambda")
            paginator = lmb.get_paginator("list_functions")
            for page in paginator.paginate():
                for fn in page.get("Functions", []):
                    assets.append({
                        "resource_id":   fn["FunctionName"],
                        "resource_name": fn["FunctionName"],
                        "resource_type": "LAMBDA",
                        "status":        "ACTIVE",
                        "region":        os.getenv("AWS_REGION", "ap-south-2"),
                        "arn":           fn.get("FunctionArn", ""),
                        "last_seen":     now,
                        "threat_count":  0,
                        "tags":          {},
                        "extra": {
                            "runtime":  fn.get("Runtime", ""),
                            "memory":   fn.get("MemorySize", 0),
                            "timeout":  fn.get("Timeout", 0),
                            "modified": fn.get("LastModified", ""),
                        }
                    })
            logger.info(f"Lambda: discovered functions")
        except Exception as e:
            logger.warning(f"Lambda discovery failed: {e}")

        # ── S3 Buckets ──────────────────────────────────────────────
        try:
            s3 = get_boto_client("s3")
            buckets = s3.list_buckets().get("Buckets", [])
            for b in buckets:
                assets.append({
                    "resource_id":   b["Name"],
                    "resource_name": b["Name"],
                    "resource_type": "S3",
                    "status":        "ACTIVE",
                    "region":        "global",
                    "arn":           f"arn:aws:s3:::{b['Name']}",
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra": {
                        "created": str(b.get("CreationDate", ""))
                    }
                })
            logger.info(f"S3: discovered {len(buckets)} buckets")
        except Exception as e:
            logger.warning(f"S3 discovery failed: {e}")

        # ── SNS Topics ──────────────────────────────────────────────
        try:
            sns = get_boto_client("sns")
            topics = sns.list_topics().get("Topics", [])
            for t in topics:
                arn  = t["TopicArn"]
                name = arn.split(":")[-1]
                assets.append({
                    "resource_id":   arn,
                    "resource_name": name,
                    "resource_type": "SNS",
                    "status":        "ACTIVE",
                    "region":        os.getenv("AWS_REGION", "ap-south-2"),
                    "arn":           arn,
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra":         {}
                })
            logger.info(f"SNS: discovered {len(topics)} topics")
        except Exception as e:
            logger.warning(f"SNS discovery failed: {e}")

        # ── DynamoDB Tables ─────────────────────────────────────────
        try:
            ddb = get_boto_client("dynamodb")
            tables = ddb.list_tables().get("TableNames", [])
            for table_name in tables:
                desc = ddb.describe_table(TableName=table_name)["Table"]
                assets.append({
                    "resource_id":   table_name,
                    "resource_name": table_name,
                    "resource_type": "DYNAMODB",
                    "status":        desc.get("TableStatus", "UNKNOWN"),
                    "region":        os.getenv("AWS_REGION", "ap-south-2"),
                    "arn":           desc.get("TableArn", ""),
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra": {
                        "item_count": desc.get("ItemCount", 0),
                        "size_bytes": desc.get("TableSizeBytes", 0),
                    }
                })
            logger.info(f"DynamoDB: discovered {len(tables)} tables")
        except Exception as e:
            logger.warning(f"DynamoDB discovery failed: {e}")

        # ── CloudTrail Trails ───────────────────────────────────────
        try:
            ct = get_boto_client("cloudtrail")
            trails = ct.describe_trails().get("trailList", [])
            for trail in trails:
                status = ct.get_trail_status(Name=trail["TrailARN"])
                is_logging = status.get("IsLogging", False)
                assets.append({
                    "resource_id":   trail.get("TrailARN", trail["Name"]),
                    "resource_name": trail["Name"],
                    "resource_type": "CLOUDTRAIL",
                    "status":        "LOGGING" if is_logging else "STOPPED",
                    "region":        os.getenv("AWS_REGION", "ap-south-2"),
                    "arn":           trail.get("TrailARN", ""),
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra": {
                        "s3_bucket":  trail.get("S3BucketName", ""),
                        "is_logging": is_logging,
                        "multi_region": trail.get("IsMultiRegionTrail", False),
                    }
                })
            logger.info(f"CloudTrail: discovered {len(trails)} trails")
        except Exception as e:
            logger.warning(f"CloudTrail discovery failed: {e}")

        # ── CloudWatch Alarms ───────────────────────────────────────
        try:
            cw = get_boto_client("cloudwatch")
            alarms = cw.describe_alarms().get("MetricAlarms", [])
            for alarm in alarms:
                assets.append({
                    "resource_id":   alarm["AlarmArn"],
                    "resource_name": alarm["AlarmName"],
                    "resource_type": "CLOUDWATCH_ALARM",
                    "status":        alarm.get("StateValue", "UNKNOWN"),
                    "region":        os.getenv("AWS_REGION", "ap-south-2"),
                    "arn":           alarm.get("AlarmArn", ""),
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra": {
                        "metric":    alarm.get("MetricName", ""),
                        "namespace": alarm.get("Namespace", ""),
                        "state":     alarm.get("StateValue", ""),
                    }
                })
            logger.info(f"CloudWatch: discovered {len(alarms)} alarms")
        except Exception as e:
            logger.warning(f"CloudWatch discovery failed: {e}")

        # ── EventBridge Rules ───────────────────────────────────────
        try:
            eb = get_boto_client("events")
            rules = eb.list_rules().get("Rules", [])
            for rule in rules:
                assets.append({
                    "resource_id":   rule.get("Arn", rule["Name"]),
                    "resource_name": rule["Name"],
                    "resource_type": "EVENTBRIDGE",
                    "status":        rule.get("State", "UNKNOWN"),
                    "region":        os.getenv("AWS_REGION", "ap-south-2"),
                    "arn":           rule.get("Arn", ""),
                    "last_seen":     now,
                    "threat_count":  0,
                    "tags":          {},
                    "extra": {
                        "schedule": rule.get("ScheduleExpression", ""),
                        "pattern":  rule.get("EventPattern", ""),
                    }
                })
            logger.info(f"EventBridge: discovered {len(rules)} rules")
        except Exception as e:
            logger.warning(f"EventBridge discovery failed: {e}")

        logger.info(f"Total assets discovered: {len(assets)}")
        return assets

    def get_aws_service_status(self) -> dict:
        """
        Returns live status of each AWS service used in the SOC platform.
        """
        status = {}
        now    = datetime.now(timezone.utc).isoformat()

        # CloudTrail
        try:
            ct     = get_boto_client("cloudtrail")
            trails = ct.describe_trails().get("trailList", [])
            if trails:
                s = ct.get_trail_status(Name=trails[0]["TrailARN"])
                status["cloudtrail"] = {
                    "status":     "LOGGING" if s.get("IsLogging") else "STOPPED",
                    "trail_name": trails[0]["Name"],
                    "healthy":    s.get("IsLogging", False)
                }
            else:
                status["cloudtrail"] = {"status": "NO TRAIL", "healthy": False}
        except Exception as e:
            status["cloudtrail"] = {"status": "ERROR", "healthy": False, "error": str(e)}

        # Lambda
        try:
            lmb   = get_boto_client("lambda")
            fns   = lmb.list_functions().get("Functions", [])
            status["lambda"] = {
                "status":          "ACTIVE",
                "function_count":  len(fns),
                "healthy":         True
            }
        except Exception as e:
            status["lambda"] = {"status": "ERROR", "healthy": False}

        # SNS
        try:
            sns    = get_boto_client("sns")
            topics = sns.list_topics().get("Topics", [])
            status["sns"] = {
                "status":       "ACTIVE",
                "topic_count":  len(topics),
                "healthy":      True
            }
        except Exception as e:
            status["sns"] = {"status": "ERROR", "healthy": False}

        # DynamoDB
        try:
            ddb    = get_boto_client("dynamodb")
            tables = ddb.list_tables().get("TableNames", [])
            status["dynamodb"] = {
                "status":       "CONNECTED",
                "table_count":  len(tables),
                "tables":       tables,
                "healthy":      True
            }
        except Exception as e:
            status["dynamodb"] = {"status": "ERROR", "healthy": False}

        # CloudWatch
        try:
            cw     = get_boto_client("cloudwatch")
            alarms = cw.describe_alarms().get("MetricAlarms", [])
            in_alarm = [a for a in alarms if a.get("StateValue") == "ALARM"]
            status["cloudwatch"] = {
                "status":        "ACTIVE",
                "alarm_count":   len(alarms),
                "in_alarm":      len(in_alarm),
                "healthy":       True
            }
        except Exception as e:
            status["cloudwatch"] = {"status": "ERROR", "healthy": False}

        # EventBridge
        try:
            eb    = get_boto_client("events")
            rules = eb.list_rules().get("Rules", [])
            enabled = [r for r in rules if r.get("State") == "ENABLED"]
            status["eventbridge"] = {
                "status":        "ROUTING",
                "rule_count":    len(rules),
                "enabled_rules": len(enabled),
                "healthy":       True
            }
        except Exception as e:
            status["eventbridge"] = {"status": "ERROR", "healthy": False}

        status["last_scan"] = now
        return status