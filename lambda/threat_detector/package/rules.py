from typing import Optional

# ============================================================
# AWS SOC Threat Detection Rules — 55+ Rules
# Covers: IAM, EC2, S3, Lambda, CloudTrail, CloudWatch,
#         VPC, KMS, RDS, DynamoDB, SNS, STS, SecretsManager
# ============================================================

THREAT_RULES = {

    # ════════════════════════════════════════════════
    # CRITICAL — Risk 90–100
    # ════════════════════════════════════════════════

    "ConsoleLogin": {
        "event_type":   "Root_ConsoleLogin",
        "severity":     "CRITICAL",
        "risk_score":   95,
        "description":  "Root account console login detected. Root must never be used for operations.",
        "mitre":        "T1078.004 — Valid Accounts: Cloud Accounts",
        "ai_analysis":  "Root account usage bypasses all IAM policies and SCPs. This is the highest severity AWS security event. Treat as potential account compromise.",
        "recommendations": [
            "Immediately investigate and verify who accessed root",
            "Enable MFA on root account",
            "Rotate root credentials",
            "Review all activity since login",
            "Enable root login CloudWatch alarm"
        ],
        "condition": lambda e: e.get("userIdentity", {}).get("type") == "Root"
    },

    "StopLogging": {
        "event_type":   "CloudTrail_StopLogging",
        "severity":     "CRITICAL",
        "risk_score":   95,
        "description":  "CloudTrail logging stopped. Attacker is hiding activity.",
        "mitre":        "T1562.008 — Impair Defenses: Disable Cloud Logs",
        "ai_analysis":  "Stopping CloudTrail is a known attacker anti-forensics technique. All subsequent API activity will be unlogged. Treat as active breach.",
        "recommendations": [
            "Re-enable CloudTrail immediately",
            "Review all activity before logging stopped",
            "Escalate to security team",
            "Enable CloudWatch alarm for StopLogging",
            "Enable log file validation"
        ],
        "condition": lambda e: True
    },

    "DeleteTrail": {
        "event_type":   "CloudTrail_DeleteTrail",
        "severity":     "CRITICAL",
        "risk_score":   95,
        "description":  "CloudTrail trail deleted. All audit logging permanently removed.",
        "mitre":        "T1562.008 — Impair Defenses: Disable Cloud Logs",
        "ai_analysis":  "Trail deletion is more severe than stopping logging. Recreate trail immediately and treat as active breach.",
        "recommendations": [
            "Recreate CloudTrail trail immediately",
            "Activate incident response plan",
            "Review all activity before deletion",
            "Check for other defense evasion indicators"
        ],
        "condition": lambda e: True
    },

    "AttachUserPolicy": {
        "event_type":   "IAM_AdminPolicyAttached_User",
        "severity":     "CRITICAL",
        "risk_score":   90,
        "description":  "AdministratorAccess policy attached to IAM user. Critical privilege escalation.",
        "mitre":        "T1548 — Abuse Elevation Control Mechanism",
        "ai_analysis":  "Attaching AdministratorAccess to a user grants full AWS access bypassing all permission boundaries. Classic privilege escalation attack.",
        "recommendations": [
            "Revoke AdminAccess policy immediately if unauthorized",
            "Apply least-privilege IAM",
            "Enable IAM Access Analyzer",
            "Review who approved this change"
        ],
        "condition": lambda e: "AdministratorAccess" in str(e.get("requestParameters", {}).get("policyArn", ""))
    },

    "AttachRolePolicy": {
        "event_type":   "IAM_AdminPolicyAttached_Role",
        "severity":     "CRITICAL",
        "risk_score":   90,
        "description":  "AdministratorAccess policy attached to IAM role.",
        "mitre":        "T1548 — Abuse Elevation Control Mechanism",
        "ai_analysis":  "Role now has full AWS administrator access. Any service or user assuming this role can do anything in the account.",
        "recommendations": [
            "Review and remove AdministratorAccess if unauthorized",
            "Audit all principals that can assume this role",
            "Use permission boundaries"
        ],
        "condition": lambda e: "AdministratorAccess" in str(e.get("requestParameters", {}).get("policyArn", ""))
    },

    "PutUserPolicy": {
        "event_type":   "IAM_InlinePolicy_Added",
        "severity":     "CRITICAL",
        "risk_score":   88,
        "description":  "Inline policy added to IAM user. Bypasses policy management controls.",
        "mitre":        "T1548 — Abuse Elevation Control Mechanism",
        "ai_analysis":  "Inline policies are harder to audit and often used to grant permissions that bypass standard policy management guardrails.",
        "recommendations": [
            "Review inline policy content",
            "Replace with managed policies",
            "Audit all inline policies"
        ],
        "condition": lambda e: True
    },

    "DisableKey": {
        "event_type":   "KMS_KeyDisabled",
        "severity":     "CRITICAL",
        "risk_score":   90,
        "description":  "KMS encryption key disabled. Encrypted data may become inaccessible.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "Disabling KMS keys is cryptographic ransomware — data is not deleted but rendered unreadable. Re-enable immediately.",
        "recommendations": [
            "Re-enable KMS key immediately",
            "Check what data relies on this key",
            "Enable key deletion protection"
        ],
        "condition": lambda e: True
    },

    "ScheduleKeyDeletion": {
        "event_type":   "KMS_KeyDeletionScheduled",
        "severity":     "CRITICAL",
        "risk_score":   92,
        "description":  "KMS key scheduled for deletion. All associated encrypted data will be permanently inaccessible.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "KMS key deletion is irreversible. Cancel immediately or all data encrypted with this key will be permanently lost.",
        "recommendations": [
            "Cancel key deletion immediately",
            "Re-encrypt data with new key if needed",
            "Enable deletion protection for all critical keys"
        ],
        "condition": lambda e: True
    },

    # ════════════════════════════════════════════════
    # HIGH — Risk 70–89
    # ════════════════════════════════════════════════

    "CreateUser": {
        "event_type":   "IAM_UserCreated",
        "severity":     "HIGH",
        "risk_score":   75,
        "description":  "New IAM user created. Verify against approved onboarding process.",
        "mitre":        "T1136.003 — Create Account: Cloud Account",
        "ai_analysis":  "Unauthorized user creation is a persistence technique. Attackers create backdoor users to maintain access after initial compromise.",
        "recommendations": [
            "Verify user was created through approved process",
            "Enforce MFA for new user",
            "Apply least-privilege permissions",
            "Tag user with owner and department"
        ],
        "condition": lambda e: True
    },

    "CreateRole": {
        "event_type":   "IAM_RoleCreated",
        "severity":     "HIGH",
        "risk_score":   72,
        "description":  "New IAM role created. Review trust policy and permissions.",
        "mitre":        "T1136.003 — Create Account: Cloud Account",
        "ai_analysis":  "New IAM roles can establish persistence or privilege escalation paths especially if the trust policy is overly permissive.",
        "recommendations": [
            "Review trust policy",
            "Verify creation was authorized",
            "Check permissions attached to role"
        ],
        "condition": lambda e: True
    },

    "UpdateAssumeRolePolicy": {
        "event_type":   "IAM_TrustPolicyModified",
        "severity":     "HIGH",
        "risk_score":   82,
        "description":  "IAM role trust policy updated. Unauthorized principals may now be able to assume this role.",
        "mitre":        "T1548 — Abuse Elevation Control Mechanism",
        "ai_analysis":  "Trust policy changes can allow external accounts to assume privileged roles. This is a critical lateral movement technique.",
        "recommendations": [
            "Review new trust policy immediately",
            "Check if external accounts were added",
            "Use IAM Access Analyzer for cross-account access"
        ],
        "condition": lambda e: True
    },

    "CreateAccessKey": {
        "event_type":   "IAM_AccessKeyCreated",
        "severity":     "HIGH",
        "risk_score":   78,
        "description":  "New IAM access key created. Long-term credentials without MFA.",
        "mitre":        "T1552.005 — Unsecured Credentials",
        "ai_analysis":  "Access keys provide persistent programmatic access without MFA. Unauthorized keys are used for long-term covert access.",
        "recommendations": [
            "Verify key creation was authorized",
            "Monitor all API calls with this key",
            "Use IAM roles instead of access keys",
            "Set up automatic key rotation policy"
        ],
        "condition": lambda e: True
    },

    "DeleteAccessKey": {
        "event_type":   "IAM_AccessKeyDeleted",
        "severity":     "HIGH",
        "risk_score":   70,
        "description":  "IAM access key deleted. May be covering tracks after compromise.",
        "mitre":        "T1070 — Indicator Removal",
        "ai_analysis":  "Key deletion can be legitimate rotation or an attacker removing evidence. Correlate with recent API activity from this key.",
        "recommendations": [
            "Verify deletion was authorized",
            "Review API calls made with this key before deletion",
            "Check if this was part of key rotation"
        ],
        "condition": lambda e: True
    },

    "DeleteSecurityGroup": {
        "event_type":   "EC2_SecurityGroupDeleted",
        "severity":     "HIGH",
        "risk_score":   82,
        "description":  "Security group deleted. Resources may now be exposed to unrestricted access.",
        "mitre":        "T1562.007 — Disable or Modify Cloud Firewall",
        "ai_analysis":  "Deleting security groups can expose AWS resources to unrestricted network access. This is a common technique used to enable lateral movement.",
        "recommendations": [
            "Verify deletion was authorized",
            "Check resources that lost security group",
            "Audit current network security posture",
            "Restore security group if unauthorized"
        ],
        "condition": lambda e: True
    },

    "AuthorizeSecurityGroupIngress": {
        "event_type":   "EC2_IngressRuleAdded",
        "severity":     "HIGH",
        "risk_score":   78,
        "description":  "New inbound security group rule added. Check for unrestricted access.",
        "mitre":        "T1562.007 — Disable or Modify Cloud Firewall",
        "ai_analysis":  "Ingress rules allowing 0.0.0.0/0 expose services to the internet. SSH/RDP open to internet is a critical risk.",
        "recommendations": [
            "Review new ingress rule",
            "Remove 0.0.0.0/0 rules on sensitive ports",
            "Use VPC endpoints instead of public access"
        ],
        "condition": lambda e: True
    },

    "AuthorizeSecurityGroupEgress": {
        "event_type":   "EC2_EgressRuleAdded",
        "severity":     "HIGH",
        "risk_score":   72,
        "description":  "Outbound security group rule modified. Data exfiltration risk.",
        "mitre":        "T1048 — Exfiltration Over Alternative Protocol",
        "ai_analysis":  "Broad egress rules can create channels for data exfiltration or C2 communication.",
        "recommendations": [
            "Review the egress rule",
            "Restrict egress to necessary destinations",
            "Check for unusual outbound traffic"
        ],
        "condition": lambda e: True
    },

    "PutBucketPolicy": {
        "event_type":   "S3_BucketPolicyChanged",
        "severity":     "HIGH",
        "risk_score":   80,
        "description":  "S3 bucket policy modified. Public access may have been granted.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "S3 bucket policy changes are the most common cause of AWS data breaches. Verify no public access was granted.",
        "recommendations": [
            "Review new bucket policy",
            "Check if public access was granted",
            "Enable S3 Block Public Access",
            "Enable S3 access logging"
        ],
        "condition": lambda e: True
    },

    "DeleteBucketPolicy": {
        "event_type":   "S3_BucketPolicyDeleted",
        "severity":     "HIGH",
        "risk_score":   75,
        "description":  "S3 bucket policy deleted. Bucket relies on account-level settings only.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "Without a bucket policy, access control depends entirely on account-level settings. Verify S3 Block Public Access is enabled.",
        "recommendations": [
            "Verify bucket is still secure",
            "Re-apply necessary bucket policy",
            "Enable S3 Block Public Access"
        ],
        "condition": lambda e: True
    },

    "DeleteBucket": {
        "event_type":   "S3_BucketDeleted",
        "severity":     "HIGH",
        "risk_score":   75,
        "description":  "S3 bucket deleted. Data loss risk if versioning was not enabled.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "S3 bucket deletion can cause permanent data loss. This may indicate ransomware, sabotage, or unauthorized destruction.",
        "recommendations": [
            "Verify deletion was authorized",
            "Check if bucket had versioning enabled",
            "Restore from backup if unauthorized"
        ],
        "condition": lambda e: True
    },

    "PutBucketAcl": {
        "event_type":   "S3_BucketACLChanged",
        "severity":     "HIGH",
        "risk_score":   78,
        "description":  "S3 bucket ACL modified. Public or cross-account access may have been granted.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "ACL changes are a common cause of unintended public S3 access. Disable ACLs and use bucket policies instead.",
        "recommendations": [
            "Review new ACL settings",
            "Disable ACLs and use bucket policies",
            "Enable S3 Block Public Access"
        ],
        "condition": lambda e: True
    },

    "DeleteFunction20150331": {
        "event_type":   "Lambda_FunctionDeleted",
        "severity":     "HIGH",
        "risk_score":   72,
        "description":  "Lambda function deleted. Security controls may have been removed.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "Deleting Lambda functions can disable security automation including threat detection pipelines.",
        "recommendations": [
            "Verify deletion was authorized",
            "Check if function was the threat detector",
            "Restore from source control"
        ],
        "condition": lambda e: True
    },

    "UpdateFunctionCode20150331v2": {
        "event_type":   "Lambda_CodeUpdated",
        "severity":     "HIGH",
        "risk_score":   78,
        "description":  "Lambda function code updated. Malicious code injection possible.",
        "mitre":        "T1525 — Implant Internal Image",
        "ai_analysis":  "Lambda code updates can inject backdoors or data exfiltration code into trusted functions running in your environment.",
        "recommendations": [
            "Review new function code",
            "Compare with version in source control",
            "Enable Lambda code signing",
            "Check execution role permissions"
        ],
        "condition": lambda e: True
    },

    "UpdateFunctionConfiguration20150331v2": {
        "event_type":   "Lambda_ConfigChanged",
        "severity":     "HIGH",
        "risk_score":   72,
        "description":  "Lambda function configuration changed. Execution role or env vars may have changed.",
        "mitre":        "T1525 — Implant Internal Image",
        "ai_analysis":  "Configuration changes can expose secrets in environment variables or escalate function permissions via execution role changes.",
        "recommendations": [
            "Review configuration changes",
            "Check environment variables for exposed secrets",
            "Verify execution role has not been changed"
        ],
        "condition": lambda e: True
    },

    "DeleteDBInstance": {
        "event_type":   "RDS_InstanceDeleted",
        "severity":     "HIGH",
        "risk_score":   82,
        "description":  "RDS database instance deleted. Potential catastrophic data loss.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "RDS deletion can cause permanent data loss. Without a final snapshot, data is irrecoverable.",
        "recommendations": [
            "Verify deletion was authorized",
            "Check if final snapshot was taken",
            "Restore from backup if unauthorized"
        ],
        "condition": lambda e: True
    },

    "CreateNetworkAcl": {
        "event_type":   "VPC_NetworkACLCreated",
        "severity":     "HIGH",
        "risk_score":   70,
        "description":  "New Network ACL created. May override subnet security controls.",
        "mitre":        "T1562.007 — Disable or Modify Cloud Firewall",
        "ai_analysis":  "A permissive NACL can bypass security group rules and expose entire subnets to attack.",
        "recommendations": [
            "Review NACL rules",
            "Ensure NACL does not allow unrestricted access",
            "Verify subnet associations"
        ],
        "condition": lambda e: True
    },

    "CreateInternetGateway": {
        "event_type":   "VPC_InternetGatewayCreated",
        "severity":     "HIGH",
        "risk_score":   72,
        "description":  "Internet gateway created. VPC resources may now have internet exposure.",
        "mitre":        "T1572 — Protocol Tunneling",
        "ai_analysis":  "Creating an internet gateway enables internet connectivity. If attached to VPC with sensitive resources, this creates attack surface.",
        "recommendations": [
            "Verify this was authorized",
            "Review routing tables",
            "Ensure security groups restrict public access"
        ],
        "condition": lambda e: True
    },

    "DeleteTable": {
        "event_type":   "DynamoDB_TableDeleted",
        "severity":     "HIGH",
        "risk_score":   80,
        "description":  "DynamoDB table deleted. Data may be permanently lost.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "DynamoDB deletion permanently destroys data unless point-in-time recovery was enabled. This can be used for data destruction attacks.",
        "recommendations": [
            "Verify deletion was authorized",
            "Restore from backup if unauthorized",
            "Enable PITR for critical tables"
        ],
        "condition": lambda e: True
    },

    # ════════════════════════════════════════════════
    # MEDIUM — Risk 40–69
    # ════════════════════════════════════════════════

    "DeleteUser": {
        "event_type":   "IAM_UserDeleted",
        "severity":     "MEDIUM",
        "risk_score":   50,
        "description":  "IAM user deleted. Verify authorized offboarding.",
        "mitre":        "T1070 — Indicator Removal",
        "ai_analysis":  "Unauthorized user deletion can remove evidence of a compromised account or disrupt legitimate access.",
        "recommendations": ["Verify deletion was authorized", "Check resources owned by this user"],
        "condition": lambda e: True
    },

    "UpdateLoginProfile": {
        "event_type":   "IAM_PasswordChanged",
        "severity":     "MEDIUM",
        "risk_score":   60,
        "description":  "IAM user password changed. May indicate account takeover.",
        "mitre":        "T1098 — Account Manipulation",
        "ai_analysis":  "Password changes on IAM accounts after compromise allow attackers to lock out legitimate users.",
        "recommendations": ["Verify change was requested by user", "Check login activity after change"],
        "condition": lambda e: True
    },

    "CreateLoginProfile": {
        "event_type":   "IAM_ConsoleAccessEnabled",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "Console access enabled for IAM user.",
        "mitre":        "T1078.004 — Valid Accounts: Cloud Accounts",
        "ai_analysis":  "Enabling console access for programmatic-only users creates unexpected attack surfaces.",
        "recommendations": ["Verify console access was legitimately requested", "Enforce MFA"],
        "condition": lambda e: True
    },

    "DetachUserPolicy": {
        "event_type":   "IAM_PolicyDetached",
        "severity":     "MEDIUM",
        "risk_score":   45,
        "description":  "IAM policy detached from user. User permissions changed.",
        "mitre":        "T1098 — Account Manipulation",
        "ai_analysis":  "Policy detachment changes user permissions. Removing critical policies can lock out legitimate users.",
        "recommendations": ["Verify change was authorized", "Check if user lost critical permissions"],
        "condition": lambda e: True
    },

    "RunInstances": {
        "event_type":   "EC2_InstanceLaunched",
        "severity":     "MEDIUM",
        "risk_score":   40,
        "description":  "EC2 instance launched. Verify authorized deployment.",
        "mitre":        "T1578.002 — Create Cloud Instance",
        "ai_analysis":  "Unauthorized EC2 launches can be used for cryptomining, C2 servers, or lateral movement.",
        "recommendations": ["Verify launch was authorized", "Check instance type for unusual sizing", "Apply mandatory tags"],
        "condition": lambda e: True
    },

    "StopInstances": {
        "event_type":   "EC2_InstanceStopped",
        "severity":     "MEDIUM",
        "risk_score":   45,
        "description":  "EC2 instance stopped. May disrupt critical workloads.",
        "mitre":        "T1489 — Service Stop",
        "ai_analysis":  "Unauthorized instance stops can cause production outages and are a form of denial of service.",
        "recommendations": ["Verify was authorized", "Check if production instance was affected"],
        "condition": lambda e: True
    },

    "TerminateInstances": {
        "event_type":   "EC2_InstanceTerminated",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "EC2 instance terminated. Instance store data permanently lost.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "Instance termination permanently destroys instance store data.",
        "recommendations": ["Verify termination was authorized", "Check if EBS volumes were retained"],
        "condition": lambda e: True
    },

    "CreateSnapshot": {
        "event_type":   "EC2_SnapshotCreated",
        "severity":     "MEDIUM",
        "risk_score":   50,
        "description":  "EC2 snapshot created. May be staged for exfiltration.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "Creating snapshots and sharing with external accounts is a known data theft technique in AWS.",
        "recommendations": ["Verify snapshot creation was authorized", "Check if snapshot is shared externally"],
        "condition": lambda e: True
    },

    "ModifySnapshotAttribute": {
        "event_type":   "EC2_SnapshotShared",
        "severity":     "MEDIUM",
        "risk_score":   65,
        "description":  "EC2 snapshot attribute modified. Snapshot may be shared externally.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "Sharing snapshots with external accounts is the most common AWS data theft method.",
        "recommendations": ["Check if snapshot was shared externally", "Remove external sharing if unauthorized"],
        "condition": lambda e: True
    },

    "CreateBucket": {
        "event_type":   "S3_BucketCreated",
        "severity":     "MEDIUM",
        "risk_score":   35,
        "description":  "New S3 bucket created. Verify encryption and access controls.",
        "mitre":        "T1537 — Transfer Data to Cloud Account",
        "ai_analysis":  "New buckets can become data exfiltration staging areas if not secured with encryption and private access.",
        "recommendations": ["Enable default encryption", "Enable versioning", "Apply least-privilege bucket policy"],
        "condition": lambda e: True
    },

    "CreateFunction20150331": {
        "event_type":   "Lambda_FunctionCreated",
        "severity":     "MEDIUM",
        "risk_score":   40,
        "description":  "New Lambda function created. Review code and permissions.",
        "mitre":        "T1203 — Exploitation for Client Execution",
        "ai_analysis":  "New Lambda functions can be used to establish persistence or execute malicious code in a trusted environment.",
        "recommendations": ["Review function code", "Check execution role permissions", "Enable code signing"],
        "condition": lambda e: True
    },

    "AddPermission20150331v2": {
        "event_type":   "Lambda_PermissionAdded",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "Lambda function permission added. External invocation access may have been granted.",
        "mitre":        "T1098 — Account Manipulation",
        "ai_analysis":  "Lambda permissions can allow external AWS accounts to invoke your functions.",
        "recommendations": ["Review who was granted invocation permission", "Check for external account access"],
        "condition": lambda e: True
    },

    "CreateTable": {
        "event_type":   "DynamoDB_TableCreated",
        "severity":     "MEDIUM",
        "risk_score":   30,
        "description":  "DynamoDB table created. Ensure encryption and access controls.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "New DynamoDB tables should have encryption, access controls, and PITR configured from creation.",
        "recommendations": ["Enable encryption at rest", "Apply least-privilege access policy", "Enable PITR"],
        "condition": lambda e: True
    },

    "CreateTopic": {
        "event_type":   "SNS_TopicCreated",
        "severity":     "MEDIUM",
        "risk_score":   35,
        "description":  "SNS topic created. Monitor for unauthorized notification channels.",
        "mitre":        "T1071 — Application Layer Protocol",
        "ai_analysis":  "Unauthorized SNS topics can be used as C2 channels or data exfiltration paths.",
        "recommendations": ["Verify creation was authorized", "Apply resource policy to restrict publishing"],
        "condition": lambda e: True
    },

    "Subscribe": {
        "event_type":   "SNS_SubscriptionCreated",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "New SNS subscription created. External endpoint may receive sensitive data.",
        "mitre":        "T1071 — Application Layer Protocol",
        "ai_analysis":  "External SNS subscriptions can be used to exfiltrate data through notification messages.",
        "recommendations": ["Verify subscription endpoint is authorized", "Check if external URLs were subscribed"],
        "condition": lambda e: True
    },

    "PutRule": {
        "event_type":   "EventBridge_RuleModified",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "EventBridge rule created or modified. Security automation may be affected.",
        "mitre":        "T1546 — Event Triggered Execution",
        "ai_analysis":  "EventBridge rule modifications can disable security detection or create unauthorized event triggers.",
        "recommendations": ["Review event pattern and targets", "Verify rule was authorized"],
        "condition": lambda e: True
    },

    "DeleteRule": {
        "event_type":   "EventBridge_RuleDeleted",
        "severity":     "MEDIUM",
        "risk_score":   60,
        "description":  "EventBridge rule deleted. Security automation may be disrupted.",
        "mitre":        "T1562 — Impair Defenses",
        "ai_analysis":  "Deleting EventBridge rules can disable automated security responses and detection pipelines.",
        "recommendations": ["Verify deletion was authorized", "Restore rule if part of security automation"],
        "condition": lambda e: True
    },

    "PutMetricAlarm": {
        "event_type":   "CloudWatch_AlarmModified",
        "severity":     "MEDIUM",
        "risk_score":   50,
        "description":  "CloudWatch alarm modified. Security monitoring coverage may be reduced.",
        "mitre":        "T1562.008 — Impair Defenses: Disable Cloud Logs",
        "ai_analysis":  "Modifying alarms can weaken security monitoring by raising thresholds or disabling critical alerts.",
        "recommendations": ["Verify modification was authorized", "Check if thresholds were weakened"],
        "condition": lambda e: True
    },

    "DeleteAlarms": {
        "event_type":   "CloudWatch_AlarmDeleted",
        "severity":     "MEDIUM",
        "risk_score":   60,
        "description":  "CloudWatch alarm deleted. Security monitoring coverage reduced.",
        "mitre":        "T1562.008 — Impair Defenses: Disable Cloud Logs",
        "ai_analysis":  "Deleting alarms removes security monitoring. Often done before executing an attack to reduce detection.",
        "recommendations": ["Recreate alarm if unauthorized", "Review remaining alarm coverage"],
        "condition": lambda e: True
    },

    "GetSecretValue": {
        "event_type":   "SecretsManager_SecretAccessed",
        "severity":     "MEDIUM",
        "risk_score":   60,
        "description":  "Secret accessed from Secrets Manager. Verify authorized application.",
        "mitre":        "T1552.001 — Unsecured Credentials: Credentials In Files",
        "ai_analysis":  "Accessing secrets outside normal application patterns indicates credential theft.",
        "recommendations": ["Verify caller identity", "Check if accessed outside normal hours", "Rotate secret if unauthorized"],
        "condition": lambda e: True
    },

    "DeleteSecret": {
        "event_type":   "SecretsManager_SecretDeleted",
        "severity":     "MEDIUM",
        "risk_score":   65,
        "description":  "Secret deleted from Secrets Manager. Applications may lose credentials.",
        "mitre":        "T1485 — Data Destruction",
        "ai_analysis":  "Secret deletion can cause application outages and disrupt services that depend on the credential.",
        "recommendations": ["Verify deletion was authorized", "Restore secret if unauthorized"],
        "condition": lambda e: True
    },

    "AssumeRole": {
        "event_type":   "STS_AssumeRole",
        "severity":     "MEDIUM",
        "risk_score":   50,
        "description":  "IAM role assumed via STS. Cross-account or cross-service access occurred.",
        "mitre":        "T1548.005 — Temporary Elevated Cloud Access",
        "ai_analysis":  "STS role assumptions indicate privilege changes. Unusual cross-account assumptions can indicate lateral movement.",
        "recommendations": ["Verify role assumption was legitimate", "Check for cross-account access", "Review subsequent API calls"],
        "condition": lambda e: True
    },

    "ModifyDBInstance": {
        "event_type":   "RDS_InstanceModified",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "RDS instance modified. Check if made publicly accessible.",
        "mitre":        "T1190 — Exploit Public-Facing Application",
        "ai_analysis":  "RDS modifications can expose databases to the internet if PubliclyAccessible is enabled.",
        "recommendations": ["Review modification", "Ensure PubliclyAccessible is false", "Verify encryption settings"],
        "condition": lambda e: True
    },

    "DeleteLogGroup": {
        "event_type":   "CloudWatch_LogGroupDeleted",
        "severity":     "MEDIUM",
        "risk_score":   55,
        "description":  "CloudWatch log group deleted. Log data permanently lost.",
        "mitre":        "T1070 — Indicator Removal",
        "ai_analysis":  "Log group deletion removes historical evidence. Used to cover tracks by removing proof of malicious activity.",
        "recommendations": ["Verify deletion was authorized", "Check if contained security logs"],
        "condition": lambda e: True
    },

    # ════════════════════════════════════════════════
    # LOW — Risk 0–39
    # ════════════════════════════════════════════════

    "GetCallerIdentity": {
        "event_type":   "STS_IdentityCheck",
        "severity":     "LOW",
        "risk_score":   20,
        "description":  "STS GetCallerIdentity called. First step in attacker reconnaissance.",
        "mitre":        "T1580 — Cloud Infrastructure Discovery",
        "ai_analysis":  "GetCallerIdentity is almost always the first call after credential theft. It confirms access and reveals account details.",
        "recommendations": ["Monitor for this call from unexpected principals or IPs"],
        "condition": lambda e: True
    },

    "ListUsers": {
        "event_type":   "IAM_UserEnumeration",
        "severity":     "LOW",
        "risk_score":   25,
        "description":  "IAM user enumeration detected.",
        "mitre":        "T1087.004 — Account Discovery: Cloud Account",
        "ai_analysis":  "IAM enumeration is reconnaissance to identify target accounts for privilege escalation.",
        "recommendations": ["Monitor for repeated enumeration", "Restrict IAM read permissions"],
        "condition": lambda e: True
    },

    "ListRoles": {
        "event_type":   "IAM_RoleEnumeration",
        "severity":     "LOW",
        "risk_score":   25,
        "description":  "IAM role enumeration detected. Attacker may be identifying escalation paths.",
        "mitre":        "T1087.004 — Account Discovery: Cloud Account",
        "ai_analysis":  "Role enumeration identifies roles with permissive trust policies for privilege escalation.",
        "recommendations": ["Restrict IAM read permissions to authorized users only"],
        "condition": lambda e: True
    },

    "DescribeInstances": {
        "event_type":   "EC2_Reconnaissance",
        "severity":     "LOW",
        "risk_score":   15,
        "description":  "EC2 instance discovery. Infrastructure reconnaissance detected.",
        "mitre":        "T1580 — Cloud Infrastructure Discovery",
        "ai_analysis":  "Discovery commands map infrastructure for potential attack targets.",
        "recommendations": ["Monitor for repeated discovery from unusual principals"],
        "condition": lambda e: True
    },

    "CreateVpc": {
        "event_type":   "VPC_Created",
        "severity":     "LOW",
        "risk_score":   30,
        "description":  "New VPC created. Verify authorized network environment.",
        "mitre":        "T1578 — Modify Cloud Compute Infrastructure",
        "ai_analysis":  "New VPCs can create isolated attacker-controlled network environments.",
        "recommendations": ["Verify VPC creation was authorized", "Apply VPC flow logs"],
        "condition": lambda e: True
    },

    "CreateKeyPair": {
        "event_type":   "EC2_KeyPairCreated",
        "severity":     "LOW",
        "risk_score":   35,
        "description":  "EC2 key pair created. SSH access credentials generated.",
        "mitre":        "T1098 — Account Manipulation",
        "ai_analysis":  "Key pair creation generates long-term SSH credentials. Unauthorized key pairs provide persistent server access.",
        "recommendations": ["Verify key pair creation was authorized", "Consider using SSM Session Manager instead of SSH"],
        "condition": lambda e: True
    },

    "LookupEvents": {
        "event_type":   "CloudTrail_LogReview",
        "severity":     "LOW",
        "risk_score":   30,
        "description":  "CloudTrail logs reviewed. Someone is reading your audit trail.",
        "mitre":        "T1530 — Data from Cloud Storage Object",
        "ai_analysis":  "Log review can be legitimate security work or an attacker checking what has been logged about their activity.",
        "recommendations": ["Verify this was an authorized security review"],
        "condition": lambda e: True
    },

    "CreateSubnet": {
        "event_type":   "VPC_SubnetCreated",
        "severity":     "LOW",
        "risk_score":   20,
        "description":  "New subnet created.",
        "mitre":        "T1578 — Modify Cloud Compute Infrastructure",
        "ai_analysis":  "New subnets expand network attack surface. Verify routing and security group associations.",
        "recommendations": ["Verify subnet was created as part of authorized infrastructure"],
        "condition": lambda e: True
    },

    "CreateLogGroup": {
        "event_type":   "CloudWatch_LogGroupCreated",
        "severity":     "LOW",
        "risk_score":   10,
        "description":  "CloudWatch log group created.",
        "mitre":        "T1562 — Impair Defenses",
        "ai_analysis":  "New log groups are normal. Ensure retention and encryption settings meet compliance requirements.",
        "recommendations": ["Verify log retention period is appropriate", "Apply KMS encryption"],
        "condition": lambda e: True
    },
}


def match_event(event_name: str, event_detail: dict) -> Optional[dict]:
    """
    Match CloudTrail event against specific threat rules.
    Returns matched rule or None.
    """
    rule = THREAT_RULES.get(event_name)
    if not rule:
        return None
    try:
        if rule["condition"](event_detail):
            return {k: v for k, v in rule.items() if k != "condition"}
    except Exception as e:
        print(f"[SOC] Rule condition error for {event_name}: {e}")
    return None


def get_default_threat(event_name: str, event_detail: dict) -> dict:
    """
    Default rule for unmatched events.
    Every CloudTrail management event becomes at least a LOW threat.
    Nothing is silently dropped.
    """
    source = event_detail.get("eventSource", "aws.unknown")
    service = source.split(".")[0].upper() if source else "AWS"

    return {
        "event_type":      f"{service}_{event_name}",
        "severity":        "LOW",
        "risk_score":      10,
        "description":     (
            f"AWS management API call '{event_name}' via {source}. "
            "Logged for audit and baseline activity tracking."
        ),
        "mitre":           "T1580 — Cloud Infrastructure Discovery",
        "ai_analysis":     (
            f"Management API call '{event_name}' detected from "
            f"{event_detail.get('sourceIPAddress','unknown')}. "
            "No specific threat rule matched. Logged for compliance and audit purposes."
        ),
        "recommendations": [
            "Review if this event was expected",
            "Log for audit and compliance purposes",
        ],
    }


def extract_event_context(event_detail: dict) -> dict:
    """Extract key security context fields from any CloudTrail event."""
    identity = event_detail.get("userIdentity", {})

    username = (
        identity.get("userName")
        or identity.get("sessionContext", {}).get("sessionIssuer", {}).get("userName")
        or identity.get("invokedBy")
        or identity.get("type", "unknown")
    )

    return {
        "source_ip":   event_detail.get("sourceIPAddress", "unknown"),
        "username":    username or "unknown",
        "region":      event_detail.get("awsRegion", "ap-south-2"),
        "event_name":  event_detail.get("eventName", ""),
        "event_time":  event_detail.get("eventTime", ""),
        "user_agent":  event_detail.get("userAgent", ""),
        "event_source": event_detail.get("eventSource", ""),
        "resource_id": str(event_detail.get("requestParameters") or {})[:200],
    }