"""Configuration from environment and CLI."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from railway_setup.guards import (
    TEMPLATE_ORIGIN_REPO,
    assert_not_template_origin,
    get_origin_repo,
    validate_repo_format,
)


def _env_bool(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes")


def _read_token_file(path: Path) -> str | None:
    if path.is_file():
        token = path.read_text().strip()
        return token or None
    return None


@dataclass(frozen=True)
class SetupConfig:
    token: str
    project_id: str
    new_repo: str
    template_origin_repo: str
    app_services: tuple[str, ...]
    prod_env_name: str
    prod_branch: str
    staging_name: str
    staging_branch: str | None
    allow_template_origin: bool
    dry_run: bool
    cwd: Path

    @classmethod
    def from_env_and_args(
        cls,
        *,
        repo: str | None = None,
        project_id: str | None = None,
        token: str | None = None,
        skip_staging: bool = False,
        dry_run: bool = False,
        cwd: Path | None = None,
    ) -> SetupConfig:
        workdir = cwd or Path.cwd()
        resolved_token = (
            token
            or os.environ.get("RAILWAY_API_TOKEN", "").strip()
            or _read_token_file(workdir / "token.md")
        )
        if not resolved_token:
            raise ValueError(
                "Missing RAILWAY_API_TOKEN. Set the env var or create token.md "
                "in the repo root (local dev only)."
            )

        resolved_project_id = (
            project_id or os.environ.get("PROJECT_ID", "").strip()
        )
        if not resolved_project_id:
            raise ValueError(
                "Missing PROJECT_ID. Copy it from the Railway dashboard (Cmd/Ctrl+K)."
            )

        resolved_repo = (
            repo
            or os.environ.get("NEW_REPO", "").strip()
            or get_origin_repo(workdir)
        )
        validate_repo_format(resolved_repo)

        template_origin = os.environ.get(
            "TEMPLATE_ORIGIN_REPO", TEMPLATE_ORIGIN_REPO
        ).strip()
        allow_template_origin = _env_bool("ALLOW_TEMPLATE_ORIGIN")

        assert_not_template_origin(
            resolved_repo,
            template_origin=template_origin,
            allow_template_origin=allow_template_origin,
        )

        app_services_raw = os.environ.get("APP_SERVICES", "frontend,backend")
        app_services = tuple(
            s.strip().lower() for s in app_services_raw.split(",") if s.strip()
        )

        staging_branch: str | None
        if skip_staging:
            staging_branch = None
        else:
            staging_branch = os.environ.get("STAGING_BRANCH", "develop").strip() or None

        return cls(
            token=resolved_token,
            project_id=resolved_project_id,
            new_repo=resolved_repo,
            template_origin_repo=template_origin,
            app_services=app_services,
            prod_env_name=os.environ.get("PROD_ENV_NAME", "production").strip(),
            prod_branch=os.environ.get("PROD_BRANCH", "main").strip(),
            staging_name=os.environ.get("STAGING_NAME", "staging").strip(),
            staging_branch=staging_branch,
            allow_template_origin=allow_template_origin,
            dry_run=dry_run,
            cwd=workdir,
        )
