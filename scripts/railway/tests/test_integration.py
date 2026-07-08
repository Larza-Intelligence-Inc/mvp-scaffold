"""Live Railway API integration tests (gated)."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from railway_setup.client import RailwayClient
from railway_setup.config import SetupConfig
from railway_setup.filters import identify_app_services
from railway_setup.cli import main
from railway_setup import queries as q
from railway_setup.setup import run_setup

pytestmark = pytest.mark.integration

TEST_PROJECT_ID = "6b242ca3-cef6-4d05-ba62-e8f2871879b8"
TEST_REPO = "Larza-Intelligence-Inc/test-scaffold"


def _integration_enabled() -> bool:
    return os.environ.get("RUN_RAILWAY_INTEGRATION", "").strip() == "1"


def _token() -> str:
    token = os.environ.get("RAILWAY_API_TOKEN", "").strip()
    if token:
        return token
    token_path = Path(__file__).resolve().parents[3] / "token.md"
    if token_path.is_file():
        return token_path.read_text().strip()
    pytest.skip("RAILWAY_API_TOKEN or token.md required")


@pytest.fixture
def skip_unless_integration() -> None:
    if not _integration_enabled():
        pytest.skip("Set RUN_RAILWAY_INTEGRATION=1 to run live Railway tests")


@pytest.fixture
def client(skip_unless_integration) -> RailwayClient:
    return RailwayClient(_token())


def test_me_query(client: RailwayClient) -> None:
    me = q.fetch_me(client)
    assert me.get("email")


def test_project_has_app_services(client: RailwayClient) -> None:
    project = q.fetch_project(client, TEST_PROJECT_ID)
    _, services = q.parse_project(project)
    apps = identify_app_services(services, ("frontend", "backend"))
    names = {s["name"] for s in apps}
    assert names == {"frontend", "backend"}


def test_template_origin_blocked_by_cli() -> None:
    env = {
        "RAILWAY_API_TOKEN": "dummy",
        "PROJECT_ID": TEST_PROJECT_ID,
        "ALLOW_TEMPLATE_ORIGIN": "",
    }
    old = os.environ.copy()
    try:
        os.environ.update(env)
        for key in ("NEW_REPO", "ALLOW_TEMPLATE_ORIGIN"):
            os.environ.pop(key, None)
        code = main(
            [
                "--repo",
                "Larza-Intelligence-Inc/mvp-scaffold",
                "--dry-run",
            ]
        )
    finally:
        os.environ.clear()
        os.environ.update(old)

    assert code == 1


def test_full_setup_idempotent(client: RailwayClient, skip_unless_integration) -> None:
    config = SetupConfig(
        token=_token(),
        project_id=os.environ.get("PROJECT_ID", TEST_PROJECT_ID),
        new_repo=os.environ.get("NEW_REPO", TEST_REPO),
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

    result = run_setup(client, config, log=lambda _: None)
    assert result.project_name
    assert len(result.configured) >= 2

    project = q.fetch_project(client, config.project_id)
    envs, _ = q.parse_project(project)
    prod = q.find_by_name(envs, "production")
    assert prod is not None
    triggers = q.get_triggers_for_env(prod)
    frontend_triggers = [t for t in triggers if t.get("branch") == "main"]
    assert frontend_triggers
    assert all(t["repository"] == config.new_repo for t in frontend_triggers)
