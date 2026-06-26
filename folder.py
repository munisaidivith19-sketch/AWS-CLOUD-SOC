import os

PROJECT_STRUCTURE = {
    "aws-cloud-soc": {
        "backend": {
            "api": {
                "v1": {
                    "__init__.py": "",
                    "router.py": "",
                }
            },
            "routes": {
                "threats.py": "",
                "incidents.py": "",
                "assets.py": "",
                "analytics.py": "",
                "dashboard.py": "",
                "auth.py": "",
            },
            "models": {
                "threat.py": "",
                "incident.py": "",
                "asset.py": "",
                "user.py": "",
            },
            "services": {
                "threat_service.py": "",
                "incident_service.py": "",
                "asset_service.py": "",
                "analytics_service.py": "",
                "ai_service.py": "",
            },
            "repositories": {
                "threat_repository.py": "",
                "incident_repository.py": "",
                "asset_repository.py": "",
            },
            "database": {
                "dynamo_client.py": "",
            },
            "middleware": {
                "auth_middleware.py": "",
                "rate_limit.py": "",
            },
            "security": {
                "jwt_auth.py": "",
                "permissions.py": "",
                "audit_logger.py": "",
            },
            "config": {
                "settings.py": "",
                "aws_config.py": "",
                "security.py": "",
            },
            "utils": {
                "risk_scorer.py": "",
                "logger.py": "",
            },
            "websocket": {
                "alert_socket.py": "",
            },
            "main.py": "",
            "requirements.txt": "",
        },

        "lambda": {
            "threat_detector": {
                "handler.py": "",
                "rules.py": "",
                "requirements.txt": "",
            },
            "incident_creator": {
                "handler.py": "",
            },
        },

        "frontend": {
            "src": {
                "pages": {
                    "Dashboard.tsx": "",
                    "Threats.tsx": "",
                    "Incidents.tsx": "",
                    "Assets.tsx": "",
                    "Analytics.tsx": "",
                },
                "components": {
                    "ThreatTable.tsx": "",
                    "SeverityBadge.tsx": "",
                    "IncidentModal.tsx": "",
                    "AIAssistant.tsx": "",
                },
                "layouts": {
                    "MainLayout.tsx": "",
                },
                "hooks": {
                    "useAuth.ts": "",
                },
                "types": {
                    "threat.ts": "",
                    "incident.ts": "",
                },
                "services": {
                    "api.ts": "",
                },
                "context": {
                    "AuthContext.tsx": "",
                },
                "App.tsx": "",
                "main.tsx": "",
            },
            "public": {},
            "package.json": "",
        },

        "docker": {
            "backend.Dockerfile": "",
            "frontend.Dockerfile": "",
            "docker-compose.yml": "",
        },

        "infrastructure": {
            "iam_policies": {
                "admin_policy.json": "",
                "analyst_policy.json": "",
                "viewer_policy.json": "",
            },
            "cloudwatch_rules": {
                "threat_rules.json": "",
            },
            "deploy": {
                "setup_ec2.sh": "",
                "nginx.conf": "",
            },
        },

        "docs": {
            "architecture.md": "",
            "api_reference.md": "",
            "user_manual.md": "",
        },

        "README.md": "",
    }
}


def create_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)

        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_structure(path, content)
        else:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)


create_structure(".", PROJECT_STRUCTURE)

print("AWS Cloud SOC project structure created successfully!")