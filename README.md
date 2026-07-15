# 🛡️ AWS Cloud Security Operations Center (SOC) Platform

<div align="center">

![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=for-the-badge&logo=amazon-dynamodb&logoColor=white)

**An enterprise-grade, AI-powered, real-time AWS Security Operations Center**
built with FastAPI, React TypeScript, and native AWS services.

[Features](#-features) •
[Architecture](#-architecture) •
[Installation](#-installation) •
[AWS Setup](#-aws-setup) •
[Deployment](#-ec2-deployment) •
[Screenshots](#-screenshots)

</div>

---

## 📌 Overview

The **AWS Cloud SOC Platform** is a production-ready Security Information and
Event Management (SIEM) system that monitors your entire AWS infrastructure
in real time. It automatically detects threats from CloudTrail events,
creates incidents, performs AI-powered analysis, and displays everything
on a beautiful glassmorphism dashboard.

This platform is comparable to:
- Microsoft Sentinel
- IBM QRadar
- Splunk Enterprise Security
- Elastic Security
- CrowdStrike Falcon
- AWS Security Hub

---

## ✨ Features

### 🔴 Real-Time Threat Detection
- Automatically detects **50+ AWS security events**
- CloudTrail → EventBridge → Lambda → DynamoDB pipeline
- Every AWS API call analyzed within seconds
- Zero manual threat creation required

### 🤖 AI-Powered Investigation
- AI analysis for every detected threat
- MITRE ATT&CK framework mapping
- Risk scoring (0–100)
- Business impact assessment
- Attack chain detection
- Recommended remediation actions
- Confidence scoring

### 🛡️ Incident Management
- Automatic incident creation for HIGH and CRITICAL threats
- Full incident lifecycle — Open → Assigned → In Progress → Resolved
- Analyst assignment and investigation notes
- False positive marking
- Resolution tracking

### 📡 Live Monitoring
- Real-time CloudTrail event feed
- Audit log streaming from soc_audit_logs table
- Attack chain detection across related events
- Auto-refresh every 15 seconds
- Login activity tracking
- Root account detection

### 📊 Analytics Dashboard
- Threat timeline (7/30/90 days)
- Severity distribution charts
- Risk score trends
- Top threat actors
- Top source IPs
- Top AWS services
- Incident trend analysis
- Audit log statistics

### 📄 AI Report Generator
- Generate professional SOC reports from live AWS data
- Export formats: **PDF, DOCX, TXT, Markdown**
- AI-generated executive summary
- Security score calculation
- Filter by date range, severity, region, user
- Report history with download links

### 👥 User Management
- Role-based access control (8 roles)
- Admin, SOC Manager, SOC Analyst, Threat Hunter,
  Incident Responder, Cloud Security Engineer, Security Engineer, Viewer
- Create, edit, disable, delete users
- Password reset and temporary password generation
- Account lockout after 5 failed login attempts
- bcrypt password hashing

### 🖥️ Asset Discovery
- Automatic AWS resource discovery
- IAM Users, IAM Roles, EC2 Instances, S3 Buckets
- Lambda Functions, DynamoDB Tables, SNS Topics
- CloudTrail Trails, CloudWatch Alarms
- EventBridge Rules, VPC resources
- Live health status for each service

---

## 🏗️ Architecture
AWS-CLOUD-SOC/
│
├── backend/
│   ├── main.py                      # FastAPI application entry point
│   ├── .env                         # Environment variables
│   ├── requirements.txt
│   ├── api/
│   │   └── v1/
│   │       └── router.py            # Route registration
│   ├── routes/
│   │   ├── auth.py                  # Authentication
│   │   ├── threats.py               # Threat management
│   │   ├── incidents.py             # Incident management
│   │   ├── assets.py                # Asset discovery
│   │   ├── analytics.py             # Analytics endpoints
│   │   ├── dashboard.py             # Dashboard data
│   │   ├── live_events.py           # Real-time polling
│   │   ├── ai_investigation.py      # AI analysis
│   │   ├── reports.py               # Report generation
│   │   └── users.py                 # User management
│   ├── services/
│   │   ├── threat_service.py
│   │   ├── incident_service.py
│   │   ├── asset_service.py
│   │   ├── analytics_service.py
│   │   ├── live_events_service.py
│   │   ├── aws_inventory_service.py # Live AWS discovery
│   │   ├── ai_service.py            # AI analysis engine
│   │   ├── user_service.py          # User management
│   │   └── report_service.py        # Report generation
│   ├── database/
│   │   └── dynamo_client.py         # DynamoDB client
│   ├── middleware/
│   │   └── auth_middleware.py       # JWT + RBAC
│   └── utils/
│       ├── jwt_handler.py
│       ├── risk_scorer.py
│       └── logger.py
│
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── services/
│       │   └── api.ts               # All API calls
│       ├── components/
│       │   ├── Sidebar.tsx          # Animated glassmorphism sidebar
│       │   ├── SeverityBadge.tsx
│       │   ├── StatusBadge.tsx
│       │   └── charts/
│       └── pages/
│           ├── Login.tsx            # Particle animation login
│           ├── Dashboard.tsx        # Glass bubble animation
│           ├── Threats.tsx          # Circuit board animation
│           ├── Incidents.tsx        # Binary rain animation
│           ├── LiveMonitor.tsx      # Real-time event feed
│           ├── AIInvestigation.tsx  # AI analysis reports
│           ├── Reports.tsx          # Report generator
│           ├── Assets.tsx           # Asset inventory
│           ├── Analytics.tsx        # Charts and analytics
│           └── UserManagement.tsx   # User admin panel
│
└── lambda/
└── threat_detector/
├── handler.py               # Lambda function
└── rules.py                 # 50+ detection rules


---

## ⚙️ Installation

### Prerequisites

- Python 3.10+
- Node.js 20+
- AWS Account with appropriate permissions
- AWS CLI configured

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/aws-cloud-soc.git
cd aws-cloud-soc
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn boto3 pydantic pydantic-settings \
  python-jose passlib python-multipart slowapi python-dotenv \
  httpx reportlab python-docx "bcrypt==4.0.1"
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Environment Configuration

Create `backend/.env`:

```env
AWS_REGION=ap-south-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
THREATS_TABLE=soc_threats
INCIDENTS_TABLE=soc_incidents
ASSETS_TABLE=soc_assets
AUDIT_LOGS_TABLE=soc_audit_logs
USERS_TABLE=soc_users
REPORTS_TABLE=soc_reports
SNS_TOPIC_ARN=arn:aws:sns:YOUR_REGION:YOUR_ACCOUNT:soc-alerts
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENVIRONMENT=development
```

### Run Locally

```bash
# Terminal 1 — Backend
cd backend
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Linux/Mac
python main.py

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173`

---

## ☁️ AWS Setup

### 1. DynamoDB Tables

Create these tables in AWS Console (all On-Demand capacity):

| Table Name | Partition Key |
|---|---|
| soc_threats | threat_id (String) |
| soc_incidents | incident_id (String) |
| soc_assets | resource_id (String) |
| soc_audit_logs | log_id (String) |
| soc_users | user_id (String) |
| soc_reports | report_id (String) |

### 2. CloudTrail

Enable CloudTrail with:
- Multi-region trail
- Log file validation enabled
- S3 bucket for log storage
- CloudWatch Logs integration

### 3. SNS Topic

Create `soc-alerts` topic and subscribe your email address.

### 4. Lambda Function

- Runtime: Python 3.11
- Handler: `handler.lambda_handler`
- Timeout: 30 seconds
- Memory: 256 MB
- Upload `lambda/threat_detector/` as zip

**Lambda Environment Variables:**
AWS_REGION=ap-south-2
THREATS_TABLE=soc_threats
INCIDENTS_TABLE=soc_incidents
AUDIT_LOGS_TABLE=soc_audit_logs
SNS_TOPIC_ARN=arn:aws:sns:...

### 5. IAM Policy for Lambda

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/soc_threats",
        "arn:aws:dynamodb:*:*:table/soc_incidents",
        "arn:aws:dynamodb:*:*:table/soc_audit_logs"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "arn:aws:sns:*:*:soc-alerts"
    }
  ]
}
```

### 6. EventBridge Rule

Create rule `soc-threat-detection-rule`:

```json
{
  "source": [{"prefix": "aws."}],
  "detail-type": [
    "AWS API Call via CloudTrail",
    "AWS Console Sign In via CloudTrail"
  ]
}
```

Target: Your Lambda function

---

## 🚀 EC2 Deployment

### Launch Instance
- AMI: Ubuntu Server 22.04 LTS
- Type: t2.medium (minimum)
- Storage: 20 GB
- Security Group: Allow ports 22, 80, 443, 8000

### Deploy

```bash
# Upload project from Windows
scp -i "soc-key.pem" -r "AWS-CLOUD-SOC" ubuntu@YOUR_EC2_IP:/home/ubuntu/

# SSH into EC2
ssh -i "soc-key.pem" ubuntu@YOUR_EC2_IP

# Install dependencies
sudo apt update && sudo apt install -y python3-venv python3-pip nodejs npm nginx

# Setup backend
cd /home/ubuntu/AWS-CLOUD-SOC/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Build frontend
cd /home/ubuntu/AWS-CLOUD-SOC/frontend
npm install
npm run build

# Start backend as service
sudo systemctl enable soc-backend
sudo systemctl start soc-backend

# Configure nginx
sudo systemctl restart nginx
```

Full deployment guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔐 Default Credentials

| Username | Password | Role |
|---|---|---|
| admin | Admin@SOC2024 | Admin |
| analyst1 | Analyst@SOC2024 | SOC Analyst |
| viewer1 | Viewer@SOC2024 | Viewer |

> ⚠️ Change these immediately in production

---

## 🎭 Role Permissions

| Role | Dashboard | Threats | Incidents | Reports | Assets | Analytics | Users |
|---|---|---|---|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SOC Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| SOC Analyst | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Threat Hunter | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Incident Responder | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cloud Security Engineer | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Security Engineer | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.11 | Runtime |
| FastAPI | REST API framework |
| boto3 | AWS SDK |
| DynamoDB | NoSQL database |
| passlib + bcrypt | Password hashing |
| python-jose | JWT tokens |
| reportlab | PDF generation |
| python-docx | DOCX generation |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Canvas API | Background animations |
| Axios | HTTP client |

### AWS Services
| Service | Purpose |
|---|---|
| CloudTrail | Audit logging |
| EventBridge | Event routing |
| Lambda | Threat detection |
| DynamoDB | Data storage |
| SNS | Email alerts |
| EC2 | Application hosting |
| IAM | Access control |
| S3 | Log storage |

---

## 📡 API Endpoints

POST   /api/v1/auth/login
GET    /api/v1/auth/me
GET    /api/v1/dashboard
GET    /api/v1/threats
POST   /api/v1/threats
PATCH  /api/v1/threats/{id}/status
GET    /api/v1/incidents
POST   /api/v1/incidents/{id}/assign
POST   /api/v1/incidents/{id}/resolve
PATCH  /api/v1/incidents/{id}/status
GET    /api/v1/assets
GET    /api/v1/assets/aws-status
GET    /api/v1/analytics/severity
GET    /api/v1/analytics/timeline
GET    /api/v1/analytics/top-threats
GET    /api/v1/analytics/summary
GET    /api/v1/analytics/risk-trend
GET    /api/v1/analytics/incident-trend
GET    /api/v1/live/events
GET    /api/v1/live/poll
GET    /api/v1/live/audit-logs
GET    /api/v1/live/attack-chains
GET    /api/v1/ai/investigate/threat/{id}
GET    /api/v1/ai/investigate/incident/{id}
GET    /api/v1/ai/summary
POST   /api/v1/reports/generate
GET    /api/v1/reports/preview
GET    /api/v1/reports/history
GET    /api/v1/users
POST   /api/v1/users
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
POST   /api/v1/users/{id}/disable
POST   /api/v1/users/{id}/enable
POST   /api/v1/users/{id}/reset-password
POST   /api/v1/users/{id}/temp-password


Full API documentation available at `http://YOUR_HOST/docs`

---

## 🔒 Security Features

- JWT authentication with configurable expiry
- bcrypt password hashing
- Role-based access control on every endpoint
- Account lockout after 5 failed login attempts
- CORS protection
- Least-privilege IAM policies
- No hardcoded credentials
- Environment variable configuration
- Request timing middleware
- Global exception handling

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch `git checkout -b feature/your-feature`
3. Commit your changes `git commit -m 'Add your feature'`
4. Push to the branch `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.
See [LICENSE](./LICENSE) for details.

---

## 👨‍💻 Author

Built as an enterprise-grade AWS Security Operations Center platform
demonstrating real-world cloud security monitoring, threat detection,
and incident response capabilities.

---

## ⚠️ Disclaimer

This platform is designed for authorized AWS environments only.
Always ensure you have permission to monitor the AWS accounts
you connect to this platform. The default credentials must be
changed before any production deployment.

---

<div align="center">

**⭐ Star this repository if you found it useful**

Built with ❤️ using AWS · FastAPI · React · TypeScript

</div>
