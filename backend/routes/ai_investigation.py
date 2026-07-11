from fastapi import APIRouter, Depends, HTTPException
from services.threat_service import ThreatService
from services.incident_service import IncidentService
from services.ai_service import analyze_threat, detect_attack_chain
from services.live_events_service import LiveEventsService
from middleware.auth_middleware import get_current_user
from utils.logger import get_logger

router      = APIRouter(prefix="/ai", tags=["AI Investigation"])
threat_svc  = ThreatService()
incident_svc = IncidentService()
live_svc    = LiveEventsService()
logger      = get_logger(__name__)

@router.get("/investigate/threat/{threat_id}")
def investigate_threat(threat_id: str, current_user=Depends(get_current_user)):
    """
    Generate complete AI investigation report for a specific threat.
    """
    threat = threat_svc.get_threat(threat_id)
    if not threat:
        raise HTTPException(404, "Threat not found")

    analysis = analyze_threat(
        event_name=  threat.get("raw_event_name", threat.get("event_type","")),
        event_type=  threat.get("event_type",""),
        severity=    threat.get("severity","LOW"),
        risk_score=  int(threat.get("risk_score",10)),
        source_ip=   threat.get("source_ip","unknown"),
        username=    threat.get("username","unknown"),
        description= threat.get("description",""),
        region=      threat.get("region","ap-south-2"),
        timestamp=   threat.get("timestamp",""),
    )

    # Get recent threats from same user for context
    all_threats = threat_svc.get_all_threats(limit=200)
    related = [
        t for t in all_threats["items"]
        if t.get("username") == threat.get("username")
        and t.get("threat_id") != threat_id
    ][:10]

    chains = detect_attack_chain(
        [threat] + related
    )

    return {
        "threat":          threat,
        "ai_analysis":     analysis,
        "related_threats": related,
        "attack_chains":   chains,
        "executive_summary": _generate_executive_summary(threat, analysis, chains),
        "cis_references":  _get_cis_references(threat.get("raw_event_name","")),
        "aws_best_practices": _get_aws_best_practices(threat.get("severity","LOW")),
    }

@router.get("/investigate/incident/{incident_id}")
def investigate_incident(incident_id: str, current_user=Depends(get_current_user)):
    """
    Generate complete AI investigation report for a specific incident.
    """
    incident = incident_svc.get_incident(incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")

    threat = threat_svc.get_threat(incident.get("threat_id",""))

    analysis = {}
    if threat:
        analysis = analyze_threat(
            event_name=  threat.get("raw_event_name", threat.get("event_type","")),
            event_type=  threat.get("event_type",""),
            severity=    incident.get("severity","LOW"),
            risk_score=  int(threat.get("risk_score",10)),
            source_ip=   threat.get("source_ip","unknown"),
            username=    threat.get("username","unknown"),
            description= threat.get("description",""),
            region=      threat.get("region","ap-south-2"),
            timestamp=   threat.get("timestamp",""),
        )

    return {
        "incident":    incident,
        "threat":      threat,
        "ai_analysis": analysis,
        "executive_summary": _generate_executive_summary(threat or {}, analysis, []),
        "timeline":    _build_timeline(incident, threat),
        "aws_best_practices": _get_aws_best_practices(incident.get("severity","LOW")),
    }

@router.get("/summary")
def ai_summary(current_user=Depends(get_current_user)):
    """
    Generate AI summary of current security posture.
    """
    counts  = threat_svc.get_counts()
    chains  = live_svc.get_attack_chains()
    logins  = live_svc.get_login_activity()

    total    = counts["total"]
    critical = counts["by_severity"].get("CRITICAL",0)
    high     = counts["by_severity"].get("HIGH",0)
    open_inc = counts["by_status"].get("OPEN",0)

    risk_level = "CRITICAL" if critical > 0 else "HIGH" if high > 0 else "MEDIUM" if open_inc > 0 else "LOW"

    summary = (
        f"Your AWS environment currently has {total} detected security events. "
        f"Critical: {critical}, High: {high}, Open incidents: {open_inc}. "
    )
    if chains["total"] > 0:
        summary += f"{chains['total']} multi-stage attack chain(s) detected. Immediate investigation required. "
    if logins["root_logins"] > 0:
        summary += f"WARNING: {logins['root_logins']} root account login(s) detected. "
    if logins["failed_logins"] > 0:
        summary += f"{logins['failed_logins']} failed login attempt(s) detected. "
    summary += (
        f"Last 24 hours: {logins['api_calls_24h']} API calls from "
        f"{logins['active_users_24h']} unique users."
    )

    return {
        "risk_level":       risk_level,
        "summary":          summary,
        "total_threats":    total,
        "critical_count":   critical,
        "high_count":       high,
        "open_incidents":   open_inc,
        "attack_chains":    chains["total"],
        "root_logins":      logins["root_logins"],
        "active_users_24h": logins["active_users_24h"],
        "api_calls_24h":    logins["api_calls_24h"],
        "recommendations": _get_posture_recommendations(risk_level, critical, high, chains["total"]),
    }


def _generate_executive_summary(threat: dict, analysis: dict, chains: list) -> str:
    if not threat:
        return "No threat data available for summary generation."

    sev    = threat.get("severity","LOW")
    user   = threat.get("username","unknown")
    ip     = threat.get("source_ip","unknown")
    region = threat.get("region","unknown")

    summary = (
        f"EXECUTIVE SUMMARY — {sev} severity security event detected. "
        f"Actor: {user} from IP {ip} in region {region}. "
    )
    if analysis:
        summary += f"MITRE ATT&CK: {analysis.get('mitre_tactic','')} ({analysis.get('mitre_technique','')}). "
        summary += f"Business Impact: {analysis.get('business_impact','')}. "
        summary += f"Confidence: {analysis.get('confidence_score',0)}%. "
    if chains:
        summary += f"Part of {len(chains)} detected attack chain(s). "
    return summary


def _get_cis_references(event_name: str) -> list:
    refs = {
        "ConsoleLogin":      ["CIS AWS 1.1 — Avoid use of root account", "CIS AWS 1.5 — Ensure MFA is enabled for root"],
        "CreateAccessKey":   ["CIS AWS 1.4 — Ensure no root access key exists", "CIS AWS 1.16 — Ensure IAM policies are attached only to groups"],
        "StopLogging":       ["CIS AWS 2.1 — Ensure CloudTrail is enabled", "CIS AWS 2.2 — Ensure CloudTrail log file validation is enabled"],
        "PutBucketPolicy":   ["CIS AWS 2.6 — Ensure S3 bucket access logging is enabled", "CIS AWS 3.8 — Ensure S3 bucket policy changes are monitored"],
        "AttachUserPolicy":  ["CIS AWS 1.16 — Ensure IAM policies attached only to groups or roles"],
        "DeleteTrail":       ["CIS AWS 2.1 — Ensure CloudTrail is enabled in all regions"],
        "AuthorizeSecurityGroupIngress": ["CIS AWS 5.1 — Ensure no security groups allow ingress from 0.0.0.0/0 to port 22"],
    }
    default = ["CIS AWS Foundations Benchmark v1.4.0", "AWS Well-Architected Security Pillar"]
    return refs.get(event_name, default)


def _get_aws_best_practices(severity: str) -> list:
    practices = {
        "CRITICAL": [
            "Enable AWS Security Hub for centralized security findings",
            "Enable GuardDuty for continuous threat detection",
            "Implement AWS Organizations SCPs to prevent privilege escalation",
            "Enable AWS Config for continuous compliance monitoring",
            "Set up AWS CloudTrail in all regions with log file validation",
            "Implement break-glass procedures for root account access",
        ],
        "HIGH": [
            "Apply least-privilege IAM policies using IAM Access Analyzer",
            "Enable MFA for all IAM users",
            "Use IAM roles instead of long-term access keys",
            "Enable VPC Flow Logs for network monitoring",
            "Implement AWS Config rules for policy compliance",
        ],
        "MEDIUM": [
            "Regular IAM credential rotation",
            "Enable S3 Block Public Access account-level",
            "Use AWS Secrets Manager for credentials",
            "Enable RDS encryption and automated backups",
        ],
        "LOW": [
            "Tag all AWS resources for cost and security tracking",
            "Enable AWS Cost Anomaly Detection",
            "Implement resource-based policies with conditions",
        ]
    }
    return practices.get(severity, practices["LOW"])


def _get_posture_recommendations(risk_level: str, critical: int, high: int, chains: int) -> list:
    recs = []
    if critical > 0:
        recs.append(f"URGENT: {critical} critical threat(s) require immediate investigation")
    if chains > 0:
        recs.append(f"CRITICAL: {chains} multi-stage attack chain(s) detected — possible active breach")
    if high > 0:
        recs.append(f"HIGH: {high} high-severity threat(s) need investigation within 1 hour")
    if not recs:
        recs.append("Security posture is acceptable — continue monitoring")
    recs += [
        "Enable AWS Security Hub across all accounts and regions",
        "Enable Amazon GuardDuty for continuous ML-based threat detection",
        "Review and tighten IAM permissions using Access Advisor",
        "Ensure CloudTrail is enabled with multi-region support",
    ]
    return recs


def _build_timeline(incident: dict, threat: dict) -> list:
    timeline = []
    if threat and threat.get("timestamp"):
        timeline.append({
            "time":   threat["timestamp"],
            "event":  "Threat detected",
            "detail": threat.get("description",""),
            "type":   "threat"
        })
    if incident.get("created_at"):
        timeline.append({
            "time":   incident["created_at"],
            "event":  "Incident created",
            "detail": f"Incident {incident['incident_id']} opened automatically",
            "type":   "incident"
        })
    if incident.get("assigned_to"):
        timeline.append({
            "time":   incident.get("updated_at",""),
            "event":  f"Assigned to {incident['assigned_to']}",
            "detail": incident.get("notes",""),
            "type":   "assignment"
        })
    if incident.get("resolved_at"):
        timeline.append({
            "time":   incident["resolved_at"],
            "event":  "Incident resolved",
            "detail": incident.get("resolution_notes",""),
            "type":   "resolution"
        })
    return sorted(timeline, key=lambda x: x.get("time",""))