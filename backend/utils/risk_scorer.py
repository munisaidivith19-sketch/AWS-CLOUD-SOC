from typing import Dict

RISK_SCORES: Dict[str, int] = {
    # Critical — 90–100
    "ConsoleLogin_Root":             95,
    "RootLogin":                     95,
    # High — 70–89
    "AttachUserPolicy_Admin":        90,
    "AttachRolePolicy_Admin":        88,
    "DeleteSecurityGroup":           82,
    "AuthorizeSecurityGroupIngress": 75,
    "StopLogging":                   85,
    "DeleteTrail":                   88,
    # Medium — 40–69
    "CreateUser":                    45,
    "DeleteUser":                    50,
    "CreateAccessKey":               60,
    "DeleteAccessKey":               40,
    "ConsoleLogin_Failed":           55,
    "UpdateAssumeRolePolicy":        65,
    # Low — 0–39
    "CreateBucket":                  25,
    "PutBucketPolicy":               35,
    "RunInstances":                  20,
    "TerminateInstances":            30,
    "CreateFunction":                20,
}

SEVERITY_MAP = {
    (90, 100): "CRITICAL",
    (70, 89):  "HIGH",
    (40, 69):  "MEDIUM",
    (0,  39):  "LOW",
}

def get_risk_score(event_type: str) -> int:
    return RISK_SCORES.get(event_type, 10)

def get_severity(score: int) -> str:
    for (low, high), severity in SEVERITY_MAP.items():
        if low <= score <= high:
            return severity
    return "LOW"

def get_recommendations(event_type: str, severity: str) -> list[str]:
    base = {
        "CRITICAL": [
            "Immediately investigate this event",
            "Enable MFA on all root and admin accounts",
            "Rotate all credentials",
            "Review CloudTrail for correlated events in the last 24 hours"
        ],
        "HIGH": [
            "Review IAM permissions and apply least privilege",
            "Check for unauthorized policy changes",
            "Enable AWS Config to track resource changes"
        ],
        "MEDIUM": [
            "Monitor the source IP for further activity",
            "Verify the action was performed by an authorized user",
            "Review access logs"
        ],
        "LOW": [
            "Log for audit purposes",
            "Ensure resource follows tagging and naming policies"
        ]
    }

    specific = {
        "ConsoleLogin_Root":      ["Disable root account access keys", "Set up billing alerts for root account"],
        "AttachUserPolicy_Admin": ["Revoke admin policy immediately if unauthorized", "Use IAM Access Analyzer"],
        "DeleteSecurityGroup":    ["Verify network security posture", "Check for open security groups"],
        "StopLogging":            ["Re-enable CloudTrail immediately", "Alert SOC team"],
    }

    recs = base.get(severity, [])
    recs += specific.get(event_type, [])
    return recs