import os
import json
from datetime import datetime, timezone
from utils.logger import get_logger

logger = get_logger(__name__)

# MITRE ATT&CK mapping
MITRE_MAPPING = {
    "ConsoleLogin":              {"technique": "T1078.004", "tactic": "Initial Access",        "name": "Valid Accounts: Cloud Accounts"},
    "CreateUser":                {"technique": "T1136.003", "tactic": "Persistence",           "name": "Create Account: Cloud Account"},
    "CreateRole":                {"technique": "T1136.003", "tactic": "Persistence",           "name": "Create Account: Cloud Account"},
    "AttachUserPolicy":          {"technique": "T1548",     "tactic": "Privilege Escalation",  "name": "Abuse Elevation Control Mechanism"},
    "AttachRolePolicy":          {"technique": "T1548",     "tactic": "Privilege Escalation",  "name": "Abuse Elevation Control Mechanism"},
    "CreateAccessKey":           {"technique": "T1552.005", "tactic": "Credential Access",     "name": "Unsecured Credentials"},
    "DeleteTrail":               {"technique": "T1562.008", "tactic": "Defense Evasion",       "name": "Disable Cloud Logs"},
    "StopLogging":               {"technique": "T1562.008", "tactic": "Defense Evasion",       "name": "Disable Cloud Logs"},
    "RunInstances":              {"technique": "T1578.002", "tactic": "Defense Evasion",       "name": "Create Cloud Instance"},
    "PutBucketPolicy":           {"technique": "T1530",     "tactic": "Collection",            "name": "Data from Cloud Storage"},
    "GetCallerIdentity":         {"technique": "T1580",     "tactic": "Discovery",             "name": "Cloud Infrastructure Discovery"},
    "AssumeRole":                {"technique": "T1548.005", "tactic": "Privilege Escalation",  "name": "Temporary Elevated Cloud Access"},
    "DeleteSecurityGroup":       {"technique": "T1562.007", "tactic": "Defense Evasion",       "name": "Disable or Modify Cloud Firewall"},
    "AuthorizeSecurityGroupIngress": {"technique": "T1562.007", "tactic": "Defense Evasion",  "name": "Disable or Modify Cloud Firewall"},
    "GetSecretValue":            {"technique": "T1552.001", "tactic": "Credential Access",     "name": "Credentials In Files"},
    "ModifySnapshotAttribute":   {"technique": "T1530",     "tactic": "Exfiltration",          "name": "Data from Cloud Storage"},
}

ATTACK_CATEGORIES = {
    "CRITICAL": "🔴 Active Attack",
    "HIGH":     "🟠 Suspicious Activity",
    "MEDIUM":   "🟡 Policy Violation",
    "LOW":      "🔵 Informational",
}

BUSINESS_IMPACT = {
    "CRITICAL": "Immediate business impact — potential full account compromise, data breach, or service disruption",
    "HIGH":     "Significant risk — unauthorized access or privilege escalation may lead to data loss",
    "MEDIUM":   "Moderate risk — policy violation that could lead to security degradation if unaddressed",
    "LOW":      "Low risk — audit event logged for compliance and baseline activity tracking",
}

def analyze_threat(
    event_name: str,
    event_type: str,
    severity: str,
    risk_score: int,
    source_ip: str,
    username: str,
    description: str,
    region: str,
    timestamp: str,
) -> dict:
    """
    Generate comprehensive AI security analysis for any threat.
    Returns structured analysis including MITRE, impact, recommendations.
    """
    mitre = MITRE_MAPPING.get(event_name, {
        "technique": "T1580",
        "tactic":    "Discovery",
        "name":      "Cloud Infrastructure Discovery"
    })

    confidence = min(95, 60 + risk_score // 3)

    # Generate contextual AI analysis
    ai_text = _generate_analysis(event_name, severity, risk_score, username, source_ip, region)

    recommendations = _get_recommendations(event_name, severity)

    return {
        "ai_analysis":      ai_text,
        "mitre_technique":  mitre["technique"],
        "mitre_tactic":     mitre["tactic"],
        "mitre_name":       mitre["name"],
        "attack_category":  ATTACK_CATEGORIES.get(severity, "🔵 Informational"),
        "business_impact":  BUSINESS_IMPACT.get(severity, BUSINESS_IMPACT["LOW"]),
        "confidence_score": confidence,
        "recommendations":  recommendations,
        "risk_score":       risk_score,
    }


def _generate_analysis(event_name: str, severity: str, risk_score: int,
                       username: str, source_ip: str, region: str) -> str:
    templates = {
        "ConsoleLogin": (
            f"Root/privileged account console login detected from {source_ip} in {region}. "
            f"Risk score: {risk_score}/100. Root account usage violates AWS security best practices "
            "and bypasses all IAM permission boundaries. This strongly indicates either compromised "
            "credentials or unauthorized insider access. Immediate credential rotation is required."
        ),
        "CreateUser": (
            f"New IAM user creation by {username} from {source_ip}. "
            f"Risk score: {risk_score}/100. Unauthorized user creation is a known persistence "
            "technique used by attackers to maintain access after initial compromise. "
            "Verify this aligns with your approved onboarding process."
        ),
        "AttachUserPolicy": (
            f"Administrator policy attachment detected by {username}. "
            f"Risk score: {risk_score}/100. This is a critical privilege escalation indicator. "
            "Attaching AdministratorAccess grants unrestricted AWS access, bypassing all "
            "permission boundaries and SCPs. Immediate review required."
        ),
        "CreateAccessKey": (
            f"New access key created by {username} from {source_ip}. "
            f"Risk score: {risk_score}/100. Long-term credentials without MFA create persistent "
            "attack surfaces. Monitor all API calls made with this key for unusual patterns."
        ),
        "StopLogging": (
            f"CloudTrail logging stopped by {username}. "
            f"Risk score: {risk_score}/100. This is a classic attacker anti-forensics technique. "
            "Stopping audit logging removes the ability to detect and investigate subsequent "
            "malicious activity. Treat this as an active breach scenario."
        ),
        "DeleteTrail": (
            f"CloudTrail trail deleted by {username}. "
            f"Risk score: {risk_score}/100. Trail deletion is more severe than stopping logging. "
            "All subsequent AWS API activity will be completely unlogged. "
            "This is a strong indicator of an active attacker covering their tracks."
        ),
        "DeleteSecurityGroup": (
            f"Security group deleted by {username} from {source_ip}. "
            f"Risk score: {risk_score}/100. Security group deletion can expose resources to "
            "unrestricted network access. Verify current network security posture immediately."
        ),
        "RunInstances": (
            f"EC2 instances launched by {username} in {region}. "
            f"Risk score: {risk_score}/100. Unauthorized instance launches are commonly used "
            "for cryptomining or establishing C2 infrastructure within trusted networks."
        ),
        "PutBucketPolicy": (
            f"S3 bucket policy modified by {username}. "
            f"Risk score: {risk_score}/100. Bucket policy changes can expose sensitive data "
            "publicly. This is one of the most common causes of AWS data breaches."
        ),
        "GetSecretValue": (
            f"Secret accessed by {username} from {source_ip}. "
            f"Risk score: {risk_score}/100. Unusual secret access patterns can indicate "
            "credential theft or unauthorized application access."
        ),
    }

    return templates.get(event_name, (
        f"AWS security event '{event_name}' detected from {username} at {source_ip} "
        f"in {region} (risk score: {risk_score}/100, severity: {severity}). "
        "This event has been logged and analyzed. Correlate with other recent activity "
        "from the same user and IP to determine if this is part of an attack pattern."
    ))


def _get_recommendations(event_name: str, severity: str) -> list:
    base = {
        "CRITICAL": [
            "Isolate affected resources immediately",
            "Rotate all credentials associated with this event",
            "Enable MFA on all privileged accounts",
            "Review CloudTrail for correlated events in the last 24 hours",
            "Escalate to senior security team immediately",
            "Consider activating your incident response plan"
        ],
        "HIGH": [
            "Investigate within 1 hour",
            "Review IAM permissions and apply least privilege",
            "Check for unauthorized policy changes",
            "Enable AWS Config to track resource changes",
            "Notify security team lead"
        ],
        "MEDIUM": [
            "Investigate within 24 hours",
            "Monitor source IP for further activity",
            "Verify action was performed by authorized user",
            "Review access logs for related activity"
        ],
        "LOW": [
            "Log for audit and compliance purposes",
            "Review periodically as part of security baseline",
            "Ensure resource follows tagging and naming policies"
        ]
    }

    specific = {
        "ConsoleLogin":    ["Disable root account access keys", "Set up root login CloudWatch alarm"],
        "StopLogging":     ["Re-enable CloudTrail immediately", "Check what happened during logging gap"],
        "DeleteTrail":     ["Recreate CloudTrail trail", "Enable CloudTrail log file validation"],
        "CreateAccessKey": ["Set up automatic key rotation", "Monitor key usage with CloudTrail"],
        "PutBucketPolicy": ["Enable S3 Block Public Access", "Run S3 Access Analyzer scan"],
        "RunInstances":    ["Check instance for cryptomining processes", "Review VPC security groups"],
        "DeleteSecurityGroup": ["Restore security group from backup", "Audit affected resources"],
    }

    recs = base.get(severity, base["LOW"]).copy()
    recs += specific.get(event_name, [])
    return recs


def detect_attack_chain(threats: list) -> list:
    """
    Detect multi-stage attack patterns from a list of recent threats.
    Returns detected attack chains with severity and description.
    """
    if not threats:
        return []

    chains = []
    event_types = [t.get("raw_event_name", t.get("event_type", "")) for t in threats]

    # Privilege Escalation Chain
    priv_esc = {"CreateUser", "AttachUserPolicy", "AttachRolePolicy", "PutUserPolicy"}
    if any(e in event_types for e in priv_esc):
        matched = [e for e in event_types if e in priv_esc]
        if matched:
            chains.append({
                "chain_id":   f"CHAIN-PRIVESC-{datetime.now(timezone.utc).strftime('%H%M%S')}",
                "name":       "Privilege Escalation Chain",
                "severity":   "CRITICAL",
                "mitre":      "T1548 — Abuse Elevation Control Mechanism",
                "events":     matched,
                "description": (
                    f"Privilege escalation sequence detected: {' → '.join(matched)}. "
                    "An attacker may be attempting to gain administrator access."
                ),
                "recommended_action": "Immediately revoke elevated permissions and review IAM policy changes"
            })

    # Defense Evasion Chain
    defense_evasion = {"StopLogging", "DeleteTrail", "DeleteAlarms", "DeleteRule"}
    if any(e in event_types for e in defense_evasion):
        matched = [e for e in event_types if e in defense_evasion]
        chains.append({
            "chain_id":   f"CHAIN-DEFEVASION-{datetime.now(timezone.utc).strftime('%H%M%S')}",
            "name":       "Defense Evasion Chain",
            "severity":   "CRITICAL",
            "mitre":      "T1562 — Impair Defenses",
            "events":     matched,
            "description": (
                f"Defense evasion sequence detected: {' → '.join(matched)}. "
                "Attacker is disabling monitoring and detection capabilities."
            ),
            "recommended_action": "Re-enable all monitoring immediately and treat as active breach"
        })

    # Persistence Chain
    persistence = {"CreateUser", "CreateAccessKey", "CreateRole", "AddPermission20150331v2"}
    if any(e in event_types for e in persistence):
        matched = [e for e in event_types if e in persistence]
        if len(matched) >= 2:
            chains.append({
                "chain_id":   f"CHAIN-PERSIST-{datetime.now(timezone.utc).strftime('%H%M%S')}",
                "name":       "Persistence Chain",
                "severity":   "HIGH",
                "mitre":      "T1136.003 — Create Account: Cloud Account",
                "events":     matched,
                "description": (
                    f"Persistence pattern detected: {' → '.join(matched)}. "
                    "Multiple backdoor access methods being established."
                ),
                "recommended_action": "Audit all newly created IAM entities and revoke unauthorized access"
            })

    # Data Exfiltration Chain
    exfil = {"CreateSnapshot", "ModifySnapshotAttribute", "PutBucketPolicy", "PutBucketAcl"}
    if any(e in event_types for e in exfil):
        matched = [e for e in event_types if e in exfil]
        chains.append({
            "chain_id":   f"CHAIN-EXFIL-{datetime.now(timezone.utc).strftime('%H%M%S')}",
            "name":       "Data Exfiltration Chain",
            "severity":   "HIGH",
            "mitre":      "T1530 — Data from Cloud Storage Object",
            "events":     matched,
            "description": (
                f"Potential data exfiltration sequence: {' → '.join(matched)}. "
                "Data may be staged for external transfer."
            ),
            "recommended_action": "Immediately restrict S3 and snapshot access, check for external sharing"
        })

    return chains