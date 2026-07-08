"""Shared pytest fixtures."""

from __future__ import annotations

import os

import pytest


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "integration: live Railway API tests (set RUN_RAILWAY_INTEGRATION=1)",
    )


def integration_enabled() -> bool:
    return os.environ.get("RUN_RAILWAY_INTEGRATION", "").strip() == "1"


@pytest.fixture
def sample_project() -> dict:
    return {
        "id": "proj-1",
        "name": "test-scaffold",
        "environments": {
            "edges": [
                {
                    "node": {
                        "id": "env-prod",
                        "name": "production",
                        "deploymentTriggers": {
                            "edges": [
                                {
                                    "node": {
                                        "id": "trig-frontend-prod",
                                        "branch": "main",
                                        "repository": "Larza-Intelligence-Inc/mvp-scaffold",
                                        "serviceId": "svc-frontend",
                                        "provider": "github",
                                        "checkSuites": False,
                                    }
                                }
                            ]
                        },
                    }
                }
            ]
        },
        "services": {
            "edges": [
                {"node": {"id": "svc-postgres", "name": "Postgres"}},
                {"node": {"id": "svc-frontend", "name": "frontend"}},
                {"node": {"id": "svc-backend", "name": "backend"}},
                {
                    "node": {
                        "id": "svc-gateway",
                        "name": "drizzle-team/gateway:latest",
                    }
                },
            ]
        },
    }


@pytest.fixture
def sample_service_instance() -> dict:
    return {
        "id": "inst-1",
        "rootDirectory": "/frontend",
        "source": {"repo": "Larza-Intelligence-Inc/mvp-scaffold", "image": None},
    }
