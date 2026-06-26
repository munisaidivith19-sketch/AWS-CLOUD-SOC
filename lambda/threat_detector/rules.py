from typing import Optional

# Each rule: event_name → threat config
THREAT_RULES = {
    # ── CRITICAL ──────────────────────────────────────────
    "ConsoleLogin": {
        "event_type":  "ConsoleLogin_Root",
        "severity":    "CRITICAL",
        "risk_score":  95,
        "description": "Root account console login detected. Immediate investigation required.",
        "condition":   lambda e: e.get("userIdentity", {}).get("type") == "Root"
    },

    # ── HIGH ───────────────────────────────────────────────
    "AttachUserPolicy": {
        "event_type":  "AttachUserPolicy_Admin",
        "severity":    "HIGH",
        "risk_score":  90,
        "description": "AdministratorAccess policy attached to IAM user. Potential privilege escalation.",
        "condition":   lambda e: "AdministratorAccess" in str(
            e.get("requestParameters", {}).get("policyArn", "")
        )
    },
    "AttachRolePolicy": {
        "event_type":  "AttachRolePolicy_Admin",
        "severity":    "HIGH",
        "risk_score":  88,
        "description": "AdministratorAccess policy attached to IAM role.",
        "condition":   lambda e: "AdministratorAccess" in str(
            e.get("requestParameters", {}).get("policyArn", "")
        )
    },
    "DeleteSecurityGroup": {
        "event_type":  "DeleteSecurityGroup",
        "severity":    "HIGH",
        "risk_score":  82,
        "description": "Security group deleted. Network security posture may be affected.",
        "condition":   lambda e: True
    },
    "StopLogging": {
        "event_type":  "StopLogging",
        "severity":    "HIGH",
        "risk_score":  85,
        "description": "CloudTrail logging stopped. Attacker may be hiding activity.",
        "condition":   lambda e: True
    },
    "DeleteTrail": {
        "event_type":  "DeleteTrail",
        "severity":    "HIGH",
        "risk_score":  88,
        "description": "CloudTrail trail deleted. All audit logging disabled.",
        "condition":   lambda e: True
    },
    "AuthorizeSecurityGroupIngress": {
        "event_type":  "AuthorizeSecurityGroupIngress",
        "severity":    "HIGH",
        "risk_score":  75,
        "description": "Security group ingress rule added. Check for 0.0.0.0/0 exposure.",
        "condition":   lambda e: True
    },

    # ── MEDIUM ─────────────────────────────────────────────
    "CreateUser": {
        "event_type":  "CreateUser",
        "severity":    "MEDIUM",
        "risk_score":  45,
        "description": "New IAM user created. Verify this follows your onboarding process.",
        "condition":   lambda e: True
    },
    "DeleteUser": {
        "event_type":  "DeleteUser",
        "severity":    "MEDIUM",
        "risk_score":  50,
        "description": "IAM user deleted. Confirm this was authorized.",
        "condition":   lambda e: True
    },
    "CreateAccessKey": {
        "event_type":  "CreateAccessKey",
        "severity":    "MEDIUM",
        "risk_score":  60,
        "description": "New IAM access key created. Monitor for unauthorized API usage.",
        "condition":   lambda e: True
    },
    "UpdateAssumeRolePolicy": {
        "event_type":  "UpdateAssumeRolePolicy",
        "severity":    "MEDIUM",
        "risk_score":  65,
        "description": "IAM role trust policy updated. Check for privilege escalation paths.",
        "condition":   lambda e: True
    },

    # ── LOW ────────────────────────────────────────────────
    "CreateBucket": {
        "event_type":  "CreateBucket",
        "severity":    "LOW",
        "risk_score":  25,
        "description": "S3 bucket created. Ensure bucket policy enforces least privilege.",
        "condition":   lambda e: True
    },
    "RunInstances": {
        "event_type":  "RunInstances",
        "severity":    "LOW",
        "risk_score":  20,
        "description": "EC2 instance launched. Verify this is an authorized deployment.",
        "condition":   lambda e: True
    },
    "CreateFunction20150331": {
        "event_type":  "CreateFunction",
        "severity":    "LOW",
        "risk_score":  20,
        "description": "Lambda function created. Review function permissions and code.",
        "condition":   lambda e: True
    },
}


def match_event(event_name: str, event_detail: dict) -> Optional[dict]:
    """
    Try to match a CloudTrail event against all threat rules.
    Returns the matched rule config or None.
    """
    rule = THREAT_RULES.get(event_name)
    if not rule:
        return None
    try:
        if rule["condition"](event_detail):
            return rule
    except Exception:
        return None
    return None


def extract_event_context(event_detail: dict) -> dict:
    """Pull the key fields we need from any CloudTrail event."""
    identity = event_detail.get("userIdentity", {})
    return {
        "source_ip": event_detail.get("sourceIPAddress", "unknown"),
        "username":  (
            identity.get("userName")
            or identity.get("sessionContext", {})
                      .get("sessionIssuer", {})
                      .get("userName")
            or identity.get("type", "unknown")
        ),
        "region":     event_detail.get("awsRegion", "us-east-1"),
        "event_name": event_detail.get("eventName", ""),
        "event_time": event_detail.get("eventTime", ""),
        "user_agent": event_detail.get("userAgent", ""),
        "resource_id": (
            str(event_detail.get("requestParameters", {}) or {})[:200]
        ),
    }