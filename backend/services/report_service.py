import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from database.dynamo_client import DynamoDBClient
from utils.logger import get_logger

logger = get_logger(__name__)

REPORTS_TABLE = os.getenv("REPORTS_TABLE", "soc_reports")


class ReportService:
    def __init__(self):
        self.threats_db   = DynamoDBClient(os.getenv("THREATS_TABLE",    "soc_threats"))
        self.incidents_db = DynamoDBClient(os.getenv("INCIDENTS_TABLE",  "soc_incidents"))
        self.audit_db     = DynamoDBClient(os.getenv("AUDIT_LOGS_TABLE", "soc_audit_logs"))
        self.assets_db    = DynamoDBClient(os.getenv("ASSETS_TABLE",     "soc_assets"))
        self.reports_db   = DynamoDBClient(REPORTS_TABLE)

    def _safe_ts(self, ts: str) -> datetime:
        """
        Always returns timezone-aware datetime.
        Handles: ISO with tz, ISO without tz, date-only strings, empty strings.
        """
        if not ts:
            return datetime(2000, 1, 1, tzinfo=timezone.utc)
        try:
            ts = ts.strip()
            # Has timezone info already
            if ts.endswith("Z"):
                return datetime.fromisoformat(ts.replace("Z", "+00:00"))
            if "+" in ts and "T" in ts:
                return datetime.fromisoformat(ts)
            # Date only: 2026-07-08
            if len(ts) == 10:
                return datetime(
                    int(ts[0:4]), int(ts[5:7]), int(ts[8:10]),
                    tzinfo=timezone.utc
                )
            # Datetime without timezone: 2026-07-08T10:30:00
            return datetime.fromisoformat(ts).replace(tzinfo=timezone.utc)
        except Exception:
            return datetime(2000, 1, 1, tzinfo=timezone.utc)

    def gather_report_data(self, filters: dict) -> dict:
        """
        Gather all live data from DynamoDB based on filters.
        All datetime comparisons use timezone-aware objects.
        """
        date_from     = filters.get("date_from")
        date_to       = filters.get("date_to")
        severity      = filters.get("severity")
        status        = filters.get("status")
        region        = filters.get("region")
        username      = filters.get("username")
        source_ip     = filters.get("source_ip")
        min_risk      = int(filters.get("min_risk_score", 0) or 0)

        # Convert filter dates to aware datetimes once
        dt_from = self._safe_ts(date_from) if date_from else None
        dt_to   = self._safe_ts(date_to)   if date_to   else None

        # ── Threats ──────────────────────────────────────────
        threat_result = self.threats_db.scan_items(limit=2000)
        all_threats   = threat_result["items"]

        def match_threat(t: dict) -> bool:
            try:
                if severity  and t.get("severity")  != severity:  return False
                if status    and t.get("status")    != status:    return False
                if region    and t.get("region")    != region:    return False
                if username  and t.get("username")  != username:  return False
                if source_ip and t.get("source_ip") != source_ip: return False
                if min_risk  and int(t.get("risk_score", 0)) < min_risk: return False
                if dt_from:
                    if self._safe_ts(t.get("timestamp", "")) < dt_from:
                        return False
                if dt_to:
                    if self._safe_ts(t.get("timestamp", "")) > dt_to:
                        return False
                return True
            except Exception:
                return True  # Include if comparison fails

        threats = [t for t in all_threats if match_threat(t)]
        threats = sorted(threats, key=lambda x: x.get("timestamp", ""), reverse=True)

        # ── Incidents ─────────────────────────────────────────
        inc_result = self.incidents_db.scan_items(limit=500)
        incidents  = inc_result["items"]

        def match_incident(i: dict) -> bool:
            try:
                if status   and i.get("status")   != status:   return False
                if severity and i.get("severity") != severity: return False
                if dt_from:
                    if self._safe_ts(i.get("created_at", "")) < dt_from:
                        return False
                if dt_to:
                    if self._safe_ts(i.get("created_at", "")) > dt_to:
                        return False
                return True
            except Exception:
                return True

        incidents = [i for i in incidents if match_incident(i)]
        incidents = sorted(incidents, key=lambda x: x.get("created_at", ""), reverse=True)

        # ── Audit Logs ────────────────────────────────────────
        try:
            audit_result = self.audit_db.scan_items(limit=500)
            audit_logs   = sorted(
                audit_result["items"],
                key=lambda x: x.get("timestamp", ""),
                reverse=True
            )[:100]
        except Exception as e:
            logger.warning(f"Audit log fetch failed: {e}")
            audit_logs = []

        # ── Assets ────────────────────────────────────────────
        try:
            from services.aws_inventory_service import AWSInventoryService
            assets = AWSInventoryService().discover_all_assets()
        except Exception:
            try:
                asset_result = self.assets_db.scan_items(limit=200)
                assets = asset_result["items"]
            except Exception:
                assets = []

        # ── Analytics ─────────────────────────────────────────
        from collections import defaultdict
        sev_counts  = defaultdict(int)
        svc_counts  = defaultdict(int)
        user_counts = defaultdict(int)
        ip_counts   = defaultdict(int)
        risk_scores = []

        for t in threats:
            sev_counts[t.get("severity", "LOW")] += 1
            svc = (t.get("event_source", "") or "").split(".")[0].upper()
            if svc:
                svc_counts[svc] += 1
            u = t.get("username", "unknown")
            if u and u != "unknown":
                user_counts[u] += 1
            ip = t.get("source_ip", "unknown")
            if ip and ip != "unknown":
                ip_counts[ip] += 1
            try:
                risk_scores.append(int(t.get("risk_score", 0)))
            except Exception:
                pass

        avg_risk  = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 0
        max_risk  = max(risk_scores) if risk_scores else 0
        open_inc  = sum(1 for i in incidents if i.get("status") == "OPEN")
        resolved  = sum(1 for i in incidents if i.get("status") == "RESOLVED")

        top_users = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_ips   = sorted(ip_counts.items(),   key=lambda x: x[1], reverse=True)[:5]
        top_svcs  = sorted(svc_counts.items(),  key=lambda x: x[1], reverse=True)[:5]

        # ── AI Security Score ─────────────────────────────────
        total          = len(threats) or 1
        critical_count = sev_counts["CRITICAL"]
        high_count     = sev_counts["HIGH"]
        security_score = max(0, 100 - int(
            (critical_count / total) * 40 +
            (high_count     / total) * 25 +
            (open_inc / max(len(incidents), 1)) * 20 +
            (avg_risk / 100) * 15
        ))

        # ── AI Executive Summary ──────────────────────────────
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

        filter_desc = ""
        if date_from or date_to:
            filter_desc = f" (period: {date_from or 'all'} to {date_to or 'now'})"

        if critical_count > 0:
            risk_level = "CRITICAL"
            posture    = (
                f"Your AWS environment is at CRITICAL risk{filter_desc}. "
                f"{critical_count} critical security event(s) detected. "
                "Immediate response is required."
            )
        elif high_count > 0:
            risk_level = "HIGH"
            posture    = (
                f"Your AWS environment has HIGH risk posture{filter_desc}. "
                f"{high_count} high-severity event(s) detected. "
                "Investigation within 1 hour is recommended."
            )
        elif len(threats) > 0:
            risk_level = "MEDIUM"
            posture    = (
                f"Your AWS environment has MEDIUM risk posture{filter_desc}. "
                f"{len(threats)} security event(s) detected requiring attention."
            )
        else:
            risk_level = "LOW"
            posture    = (
                f"Your AWS environment shows LOW risk posture{filter_desc}. "
                "No critical threats detected."
            )

        executive_summary = (
            f"Security Assessment — {now_str}.\n\n"
            f"{posture}\n\n"
            f"THREAT SUMMARY: {len(threats)} total threats. "
            f"Critical: {critical_count}, High: {high_count}, "
            f"Medium: {sev_counts['MEDIUM']}, Low: {sev_counts['LOW']}.\n\n"
            f"INCIDENT SUMMARY: {len(incidents)} total incidents. "
            f"Open: {open_inc}, Resolved: {resolved}.\n\n"
            f"RISK METRICS: Average risk score {avg_risk}/100. "
            f"Maximum risk score {max_risk}/100.\n\n"
            f"ASSET INVENTORY: {len(assets)} AWS resources monitored.\n\n"
            f"TOP RISK USERS: "
            f"{', '.join([u[0] for u in top_users[:3]]) if top_users else 'None'}.\n\n"
            f"SECURITY SCORE: {security_score}/100 — "
            f"{'EXCELLENT' if security_score >= 80 else 'GOOD' if security_score >= 60 else 'FAIR' if security_score >= 40 else 'POOR'}."
        )

        recommendations = self._generate_recommendations(
            critical_count, high_count, open_inc,
            security_score, top_users, top_ips
        )

        return {
            "generated_at":    now_str,
            "filters_applied": filters,
            "threats":         threats,
            "incidents":       incidents,
            "audit_logs":      audit_logs,
            "assets":          assets,
            "analytics": {
                "severity_breakdown":  dict(sev_counts),
                "top_services":        [{"name": s[0], "count": s[1]} for s in top_svcs],
                "top_users":           [{"name": u[0], "count": u[1]} for u in top_users],
                "top_source_ips":      [{"name": i[0], "count": i[1]} for i in top_ips],
                "average_risk_score":  avg_risk,
                "max_risk_score":      max_risk,
                "total_threats":       len(threats),
                "total_incidents":     len(incidents),
                "open_incidents":      open_inc,
                "resolved_incidents":  resolved,
            },
            "ai_summary": {
                "executive_summary": executive_summary,
                "security_score":    security_score,
                "risk_level":        risk_level,
                "recommendations":   recommendations,
                "critical_findings": [
                    t["description"] for t in threats
                    if t.get("severity") == "CRITICAL"
                ][:5],
                "high_risk_users": [u[0] for u in top_users[:3]],
                "high_risk_ips":   [i[0] for i in top_ips[:3]],
            },
        }

    def _generate_recommendations(
        self, critical: int, high: int,
        open_inc: int, score: int,
        top_users: list, top_ips: list
    ) -> list:
        recs = []
        if critical > 0:
            recs.append(
                f"IMMEDIATE: {critical} critical threat(s) require "
                "immediate investigation and response."
            )
        if high > 0:
            recs.append(
                f"URGENT: {high} high-severity threat(s) need "
                "investigation within 1 hour."
            )
        if open_inc > 0:
            recs.append(
                f"Assign and resolve {open_inc} open incident(s) "
                "to reduce risk exposure."
            )
        if top_users:
            recs.append(
                f"Review activity of high-risk users: "
                f"{', '.join([u[0] for u in top_users[:3]])}."
            )
        if top_ips:
            recs.append(
                f"Investigate source IPs with high activity: "
                f"{', '.join([i[0] for i in top_ips[:3]])}."
            )
        recs += [
            "Enable AWS Security Hub for centralized security findings.",
            "Enable Amazon GuardDuty for ML-based continuous threat detection.",
            "Review and enforce MFA for all IAM users.",
            "Apply least-privilege IAM policies using IAM Access Analyzer.",
            "Enable AWS Config for continuous compliance monitoring.",
            "Ensure CloudTrail is enabled with log file validation in all regions.",
            "Enable S3 Block Public Access at the account level.",
            "Implement AWS Organizations SCPs to prevent privilege escalation.",
        ]
        return recs

    def save_report_record(
        self, report_id: str, name: str,
        generated_by: str, fmt: str,
        report_type: str, filters: dict
    ) -> dict:
        now  = datetime.now(timezone.utc).isoformat()
        item = {
            "report_id":    report_id,
            "name":         name,
            "generated_by": generated_by,
            "generated_at": now,
            "format":       fmt,
            "report_type":  report_type,
            "filters":      str(filters),
            "status":       "COMPLETED",
        }
        try:
            self.reports_db.put_item(item)
        except Exception as e:
            logger.warning(f"Could not save report record: {e}")
        return item

    def get_report_history(self) -> dict:
        try:
            result = self.reports_db.scan_items(limit=200)
            items  = sorted(
                result["items"],
                key=lambda x: x.get("generated_at", ""),
                reverse=True
            )
            return {"total": len(items), "items": items}
        except Exception as e:
            logger.warning(f"Report history unavailable: {e}")
            return {"total": 0, "items": []}

    def delete_report(self, report_id: str) -> bool:
        try:
            return self.reports_db.delete_item({"report_id": report_id})
        except Exception as e:
            logger.error(f"Delete report failed: {e}")
            return False