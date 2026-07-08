"""Unit tests for setup orchestration."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from railway_setup.client import RailwayApiError
from railway_setup.config import SetupConfig
from railway_setup.filters import identify_app_services
from railway_setup.setup import (
    build_summary_table,
    configure_environment,
    duplicate_environment,
    run_setup,
    upsert_deployment_trigger,
)


def _config(**overrides) -> SetupConfig:
    defaults = dict(
        token="tok",
        project_id="proj-1",
        new_repo="acme/my-fork",
        template_origin_repo="Larza-Intelligence-Inc/mvp-scaffold",
        app_services=("frontend", "backend"),
        prod_env_name="production",
        prod_branch="main",
        staging_name="staging",
        staging_branch="develop",
        allow_template_origin=False,
        dry_run=False,
        cwd=Path("."),
    )
    defaults.update(overrides)
    return SetupConfig(**defaults)


def test_identify_app_services(sample_project) -> None:
    _, services = (
        [e["node"] for e in sample_project["environments"]["edges"]],
        [s["node"] for s in sample_project["services"]["edges"]],
    )
    matched = identify_app_services(services, ("frontend", "backend"))
    names = {s["name"] for s in matched}
    assert names == {"frontend", "backend"}


def test_upsert_deployment_trigger_creates(sample_project) -> None:
    client = MagicMock()
    client.gql.return_value = {"deploymentTriggerCreate": {"id": "new-trig"}}
    config = _config(dry_run=False)
    logs: list[str] = []

    upsert_deployment_trigger(
        client,
        config=config,
        environment_id="env-prod",
        service_id="svc-frontend",
        branch="main",
        existing_trigger=None,
        log=logs.append,
    )

    assert any("create trigger" in line for line in logs)
    client.gql.assert_called_once()


def test_upsert_deployment_trigger_updates_when_branch_differs() -> None:
    client = MagicMock()
    client.gql.return_value = {"deploymentTriggerUpdate": {"id": "trig-1"}}
    config = _config(dry_run=False)
    existing = {
        "id": "trig-1",
        "branch": "main",
        "repository": "old/repo",
        "serviceId": "svc-frontend",
    }

    upsert_deployment_trigger(
        client,
        config=config,
        environment_id="env-prod",
        service_id="svc-frontend",
        branch="develop",
        existing_trigger=existing,
        log=lambda _: None,
    )

    client.gql.assert_called_once()


def test_upsert_deployment_trigger_skips_when_unchanged() -> None:
    client = MagicMock()
    config = _config(new_repo="acme/repo", dry_run=False)
    existing = {
        "id": "trig-1",
        "branch": "main",
        "repository": "acme/repo",
        "serviceId": "svc-frontend",
    }

    upsert_deployment_trigger(
        client,
        config=config,
        environment_id="env-prod",
        service_id="svc-frontend",
        branch="main",
        existing_trigger=existing,
        log=lambda _: None,
    )

    client.gql.assert_not_called()


def test_configure_environment_skips_repo_update(
    sample_project, sample_service_instance
) -> None:
    client = MagicMock()
    already = {**sample_service_instance, "source": {"repo": "acme/my-fork", "image": None}}
    client.gql.side_effect = [
        {"serviceInstance": already},
        {"deploymentTriggerUpdate": {"id": "trig-1"}},
        None,
    ]

    env = sample_project["environments"]["edges"][0]["node"]
    services = [s["node"] for s in sample_project["services"]["edges"] if s["node"]["name"] == "frontend"]
    config = _config(new_repo="acme/my-fork", dry_run=False)
    from railway_setup.setup import SetupResult

    result = SetupResult(project_name="", new_repo="acme/my-fork")
    logs: list[str] = []

    configure_environment(
        client,
        config=config,
        env=env,
        branch="main",
        app_services=services,
        log=logs.append,
        result=result,
    )

    assert any("repo already" in line for line in logs)
    gql_calls = [call.args[0] for call in client.gql.call_args_list]
    assert not any("serviceInstanceUpdate" in q for q in gql_calls)


def test_duplicate_environment_returns_existing() -> None:
    client = MagicMock()
    config = _config(dry_run=False)
    prod = {"id": "env-prod", "name": "production"}
    staging = {"id": "env-staging", "name": "staging"}

    result = duplicate_environment(
        client,
        config=config,
        prod_env=prod,
        envs=[prod, staging],
        log=lambda _: None,
    )

    assert result["id"] == "env-staging"
    client.gql.assert_not_called()


def test_duplicate_environment_polls_after_504(sample_project) -> None:
    client = MagicMock()
    config = _config(dry_run=False)
    prod = {"id": "env-prod", "name": "production"}

    project_with_staging = {
        **sample_project,
        "environments": {
            "edges": [
                *sample_project["environments"]["edges"],
                {
                    "node": {
                        "id": "env-staging",
                        "name": "staging",
                        "deploymentTriggers": {"edges": []},
                    }
                },
            ]
        },
    }

    client.gql.side_effect = [
        RailwayApiError("504 Gateway Timeout"),
        {"project": project_with_staging},
    ]

    from unittest.mock import patch

    with patch("railway_setup.setup.time.sleep"):
        result = duplicate_environment(
            client,
            config=config,
            prod_env=prod,
            envs=[prod],
            log=lambda _: None,
        )

    assert result["name"] == "staging"


def test_run_setup_skips_staging(sample_project, sample_service_instance) -> None:
    client = MagicMock()

    def gql_router(query: str, variables=None):
        if "me {" in query:
            return {"me": {"name": "Test", "email": "t@example.com"}}
        if "project(id:" in query:
            return {"project": sample_project}
        if "serviceInstance(" in query:
            return {"serviceInstance": sample_service_instance}
        if "deploymentTriggerCreate" in query:
            return {"deploymentTriggerCreate": {"id": "t-new"}}
        if "serviceInstanceAutoDeployUpdate" in query:
            return {"serviceInstanceAutoDeployUpdate": True}
        if "environmentPatchCommitStaged" in query:
            return {"environmentPatchCommitStaged": True}
        if "serviceInstanceRedeploy" in query:
            return {"serviceInstanceRedeploy": True}
        return {}

    client.gql.side_effect = gql_router
    config = _config(staging_branch=None, dry_run=False)

    result = run_setup(client, config, log=lambda _: None)

    assert result.project_name == "test-scaffold"
    gql_text = " ".join(str(c) for c in client.gql.call_args_list)
    assert "environmentCreate" not in gql_text


def test_build_summary_table() -> None:
    table = build_summary_table(
        [
            {
                "environment": "production",
                "service": "frontend",
                "repo": "acme/app",
                "branch": "main",
            }
        ]
    )
    assert "production" in table
    assert "frontend" in table
