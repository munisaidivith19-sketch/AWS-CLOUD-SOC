(.venv) PS D:\POJECTS\AI ATDDENCE\AWS-CLOUD-SOC\backend> python main.py
2026-07-11 12:02:11 | INFO     | router | Route loaded: routes.live_events
2026-07-11 12:02:11 | INFO     | router | Route loaded: routes.ai_investigation
2026-07-11 12:02:11 | ERROR    | router | Route failed: routes.users — cannot import name 'ROLE_PERMISSIONS' from 'services.user_service' (D:\POJECTS\AI ATDDENCE\AWS-CLOUD-SOC\backend\services\user_service.py)
2026-07-11 12:02:11 | INFO     | router | Route loaded: routes.reports
INFO:     Will watch for changes in these directories: ['D:\\POJECTS\\AI ATDDENCE\\AWS-CLOUD-SOC\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [13492] using WatchFiles
2026-07-11 12:02:13 | INFO     | router | Route loaded: routes.live_events
2026-07-11 12:02:13 | INFO     | router | Route loaded: routes.ai_investigation
2026-07-11 12:02:13 | ERROR    | router | Route failed: routes.users — cannot import name 'ROLE_PERMISSIONS' from 'services.user_service' (D:\POJECTS\AI ATDDENCE\AWS-CLOUD-SOC\backend\services\user_service.py)
2026-07-11 12:02:13 | INFO     | router | Route loaded: routes.reports
INFO:     Started server process [18948]
INFO:     Waiting for application startup.
2026-07-11 12:02:13 | INFO     | main | =======================================================
2026-07-11 12:02:13 | INFO     | main |   AWS Cloud SOC Platform — Starting
2026-07-11 12:02:13 | INFO     | main |   Environment : development
2026-07-11 12:02:13 | INFO     | main |   Region      : ap-south-2
2026-07-11 12:02:13 | INFO     | main | =======================================================
2026-07-11 12:02:14 | INFO     | main | ✅ User seeding complete
INFO:     Application startup complete.
2026-07-11 12:03:04 | INFO     | services.aws_inventory_service | IAM: discovered 6 users
2026-07-11 12:03:05 | INFO     | services.aws_inventory_service | EC2: discovered 6 instances
2026-07-11 12:03:05 | INFO     | services.aws_inventory_service | Lambda: discovered functions
2026-07-11 12:03:06 | INFO     | services.aws_inventory_service | S3: discovered 2 buckets
2026-07-11 12:03:06 | INFO     | services.aws_inventory_service | SNS: discovered 1 topics
2026-07-11 12:03:07 | INFO     | services.aws_inventory_service | DynamoDB: discovered 7 tables
2026-07-11 12:03:08 | INFO     | services.aws_inventory_service | CloudTrail: discovered 1 trails
2026-07-11 12:03:09 | INFO     | services.aws_inventory_service | CloudWatch: discovered 0 alarms
2026-07-11 12:03:10 | INFO     | services.aws_inventory_service | EventBridge: discovered 1 rules
2026-07-11 12:03:10 | INFO     | services.aws_inventory_service | Total assets discovered: 19
2026-07-11 12:03:12 | INFO     | main | GET /api/v1/dashboard → 200 (9855.05ms)
INFO:     127.0.0.1:57764 - "GET /api/v1/dashboard HTTP/1.1" 200 OK
2026-07-11 12:03:20 | INFO     | main | GET /api/v1/threats → 200 (86.04ms)
INFO:     127.0.0.1:39486 - "GET /api/v1/threats?limit=100 HTTP/1.1" 200 OK
2026-07-11 12:03:22 | INFO     | main | GET /api/v1/incidents → 200 (110.67ms)
INFO:     127.0.0.1:19440 - "GET /api/v1/incidents HTTP/1.1" 200 OK
2026-07-11 12:03:24 | INFO     | main | GET /api/v1/live/audit-logs → 200 (68.04ms)
INFO:     127.0.0.1:54960 - "GET /api/v1/live/audit-logs?limit=200 HTTP/1.1" 200 OK
2026-07-11 12:03:25 | INFO     | main | GET /api/v1/live/poll → 200 (713.52ms)
INFO:     127.0.0.1:54961 - "GET /api/v1/live/poll HTTP/1.1" 200 OK
2026-07-11 12:03:30 | INFO     | main | GET /api/v1/live/attack-chains → 200 (140.58ms)
INFO:     127.0.0.1:2870 - "GET /api/v1/live/attack-chains HTTP/1.1" 200 OK
2026-07-11 12:03:30 | INFO     | main | GET /api/v1/ai/summary → 200 (326.84ms)
INFO:     127.0.0.1:2871 - "GET /api/v1/ai/summary HTTP/1.1" 200 OK
2026-07-11 12:03:30 | INFO     | main | GET /api/v1/threats → 200 (358.71ms)
INFO:     127.0.0.1:2872 - "GET /api/v1/threats?limit=50 HTTP/1.1" 200 OK
2026-07-11 12:03:35 | INFO     | main | GET /api/v1/reports/history → 200 (97.03ms)
INFO:     127.0.0.1:19174 - "GET /api/v1/reports/history HTTP/1.1" 200 OK
2026-07-11 12:03:44 | INFO     | services.aws_inventory_service | IAM: discovered 6 users
2026-07-11 12:03:44 | INFO     | services.aws_inventory_service | EC2: discovered 6 instances
2026-07-11 12:03:45 | INFO     | services.aws_inventory_service | Lambda: discovered functions
2026-07-11 12:03:45 | INFO     | services.aws_inventory_service | S3: discovered 2 buckets
2026-07-11 12:03:45 | INFO     | services.aws_inventory_service | SNS: discovered 1 topics
2026-07-11 12:03:46 | INFO     | services.aws_inventory_service | DynamoDB: discovered 7 tables
2026-07-11 12:03:47 | INFO     | services.aws_inventory_service | CloudTrail: discovered 1 trails
2026-07-11 12:03:47 | INFO     | services.aws_inventory_service | CloudWatch: discovered 0 alarms
2026-07-11 12:03:48 | INFO     | services.aws_inventory_service | EventBridge: discovered 1 rules
2026-07-11 12:03:48 | INFO     | services.aws_inventory_service | Total assets discovered: 19
2026-07-11 12:03:48 | INFO     | main | GET /api/v1/reports/preview → 200 (5621.86ms)
INFO:     127.0.0.1:48932 - "GET /api/v1/reports/preview?report_type=weekly&format=pdf HTTP/1.1" 200 OK
2026-07-11 12:03:52 | INFO     | services.aws_inventory_service | IAM: discovered 6 users
2026-07-11 12:03:53 | INFO     | services.aws_inventory_service | EC2: discovered 6 instances
2026-07-11 12:03:53 | INFO     | services.aws_inventory_service | Lambda: discovered functions
2026-07-11 12:03:53 | INFO     | services.aws_inventory_service | S3: discovered 2 buckets
2026-07-11 12:03:54 | INFO     | services.aws_inventory_service | SNS: discovered 1 topics
2026-07-11 12:03:55 | INFO     | services.aws_inventory_service | DynamoDB: discovered 7 tables
2026-07-11 12:03:55 | INFO     | services.aws_inventory_service | CloudTrail: discovered 1 trails
2026-07-11 12:03:56 | INFO     | services.aws_inventory_service | CloudWatch: discovered 0 alarms
2026-07-11 12:03:56 | INFO     | services.aws_inventory_service | EventBridge: discovered 1 rules
2026-07-11 12:03:56 | INFO     | services.aws_inventory_service | Total assets discovered: 19
2026-07-11 12:03:56 | INFO     | main | POST /api/v1/reports/generate → 200 (5313.33ms)
INFO:     127.0.0.1:55311 - "POST /api/v1/reports/generate HTTP/1.1" 200 OK
2026-07-11 12:03:56 | INFO     | main | GET /api/v1/reports/history → 200 (81.25ms)
INFO:     127.0.0.1:23627 - "GET /api/v1/reports/history HTTP/1.1" 200 OK
2026-07-11 12:04:29 | INFO     | services.aws_inventory_service | IAM: discovered 6 users
2026-07-11 12:04:29 | INFO     | services.aws_inventory_service | EC2: discovered 6 instances
2026-07-11 12:04:29 | INFO     | services.aws_inventory_service | Lambda: discovered functions
2026-07-11 12:04:30 | INFO     | services.aws_inventory_service | S3: discovered 2 buckets
2026-07-11 12:04:30 | INFO     | services.aws_inventory_service | SNS: discovered 1 topics
2026-07-11 12:04:32 | INFO     | services.aws_inventory_service | DynamoDB: discovered 7 tables
2026-07-11 12:04:34 | INFO     | services.aws_inventory_service | CloudTrail: discovered 1 trails
2026-07-11 12:04:35 | INFO     | services.aws_inventory_service | CloudWatch: discovered 0 alarms
2026-07-11 12:04:37 | INFO     | services.aws_inventory_service | EventBridge: discovered 1 rules
2026-07-11 12:04:37 | INFO     | services.aws_inventory_service | Total assets discovered: 19
2026-07-11 12:04:37 | INFO     | main | GET /api/v1/assets → 200 (9580.16ms)
INFO:     127.0.0.1:22567 - "GET /api/v1/assets HTTP/1.1" 200 OK
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/severity → 200 (640.18ms)
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/timeline → 200 (639.62ms)
INFO:     127.0.0.1:64374 - "GET /api/v1/analytics/severity HTTP/1.1" 200 OK
INFO:     127.0.0.1:64375 - "GET /api/v1/analytics/timeline?days=30 HTTP/1.1" 200 OK
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/top-threats → 200 (633.25ms)
INFO:     127.0.0.1:12412 - "GET /api/v1/analytics/top-threats HTTP/1.1" 200 OK
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/audit-logs → 200 (122.17ms)
INFO:     127.0.0.1:40225 - "GET /api/v1/analytics/audit-logs HTTP/1.1" 200 OK
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/risk-trend → 200 (142.97ms)
INFO:     127.0.0.1:40223 - "GET /api/v1/analytics/risk-trend HTTP/1.1" 200 OK
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/incident-trend → 200 (156.17ms)
INFO:     127.0.0.1:40224 - "GET /api/v1/analytics/incident-trend HTTP/1.1" 200 OK
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/active-users → 200 (1413.51ms)
2026-07-11 12:04:49 | INFO     | main | GET /api/v1/analytics/top-ips → 200 (1413.51ms)
INFO:     127.0.0.1:12414 - "GET /api/v1/analytics/active-users HTTP/1.1" 200 OK
INFO:     127.0.0.1:12415 - "GET /api/v1/analytics/top-ips HTTP/1.1" 200 OK
2026-07-11 12:04:50 | INFO     | main | GET /api/v1/analytics/summary → 200 (1546.54ms)
INFO:     127.0.0.1:12413 - "GET /api/v1/analytics/summary HTTP/1.1" 200 OK
2026-07-11 12:04:56 | INFO     | main | GET /api/v1/users → 404 (0.0ms)
INFO:     127.0.0.1:62977 - "GET /api/v1/users HTTP/1.1" 404 Not Found
2026-07-11 12:05:14 | INFO     | main | POST /api/v1/users → 404 (0.0ms)
INFO:     127.0.0.1:42158 - "POST /api/v1/users HTTP/1.1" 404 Not Found
2026-07-11 12:05:33 | INFO     | main | POST /api/v1/users → 404 (0.0ms)
INFO:     127.0.0.1:12000 - "POST /api/v1/users HTTP/1.1" 404 Not Found
2026-07-11 12:06:26 | INFO     | main | POST /api/v1/users → 404 (0.0ms)
INFO:     127.0.0.1:1933 - "POST /api/v1/users HTTP/1.1" 404 Not Found
