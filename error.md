You are a Senior AWS Cloud Security Engineer and Senior Python Backend Developer.

Analyze my existing AWS Cloud SOC project before making any changes.

DO NOT regenerate my project.

DO NOT redesign the frontend.

DO NOT modify the React UI.

DO NOT change my API routes.

DO NOT change my project architecture.

I only want you to fix the threat detection pipeline.

======================================================
CURRENT STATUS
======================================================

My AWS infrastructure is working correctly.

✓ CloudTrail is enabled and recording events.

✓ EventBridge rule is enabled.

✓ EventBridge successfully invokes my Lambda.

✓ Lambda executes successfully with zero errors.

✓ Lambda can write to DynamoDB.

✓ FastAPI reads from DynamoDB.

✓ React dashboard displays records stored in DynamoDB.

Therefore the infrastructure is NOT the problem.

======================================================
CURRENT ISSUE
======================================================

The dashboard only shows threats that already exist inside DynamoDB.

It does NOT automatically detect new AWS activities.

For example,

Creating IAM users

Creating IAM roles

Deleting IAM users

Launching EC2 instances

Stopping EC2

Creating S3 buckets

Deleting S3 buckets

Creating Lambda functions

Updating Lambda functions

Creating Security Groups

Modifying Security Groups

CloudTrail changes

and many other AWS activities

are NOT automatically becoming Threats.

The SOC only detects a very small number of CloudTrail events.

======================================================
ROOT CAUSE
======================================================

The Lambda handler calls:

matched_rule = match_event(event_name, detail)

If no rule exists,

Lambda immediately exits.

Therefore any CloudTrail event that does not exist inside rules.py is ignored.

This prevents my SOC from detecting most AWS security events.

======================================================
WHAT I NEED
======================================================

Analyze rules.py.

Expand the threat detection engine.

Instead of supporting only a few AWS events,

support a professional AWS SOC rule set.

Include detection for IAM, EC2, Lambda, S3, CloudTrail, CloudWatch, EventBridge, VPC, Security Groups, DynamoDB, SNS and other important AWS services.

Implement approximately 50–60 meaningful AWS security detection rules.

Each rule should include:

Event Name

Threat Name

Severity

Risk Score

Description

Recommended Actions

MITRE ATT&CK Mapping

AI Analysis

======================================================
DEFAULT DETECTION
======================================================

If an AWS CloudTrail event does NOT match any predefined rule,

do NOT ignore it.

Instead,

automatically create a LOW severity threat so every CloudTrail management event is recorded.

Only High and Critical events should automatically create incidents and send SNS alerts.

======================================================
VERIFY THE COMPLETE PIPELINE
======================================================

After implementing the improved rule engine,

verify that this flow works correctly.

AWS Activity

↓

CloudTrail

↓

EventBridge

↓

Lambda

↓

Threat Detection Rules

↓

Risk Scoring

↓

Create Threat

↓

Create Incident (High/Critical)

↓

Store in DynamoDB

↓

FastAPI

↓

React Dashboard

======================================================
IMPORTANT
======================================================

Do NOT regenerate the frontend.

Do NOT regenerate backend architecture.

Do NOT create duplicate services.

Modify only the existing Lambda detection logic and rules.py.

Reuse the current project.

======================================================
OUTPUT
======================================================

1. Explain why live AWS events were not becoming threats.

2. Explain which files were modified.

3. Explain every new detection rule added.

4. Confirm that new AWS activities automatically appear on the dashboard without manual threat creation.