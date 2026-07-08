"""Orchestration for Railway post-template setup."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable

from railway_setup.client import RailwayApiError, RailwayClient
from railway_setup.config import SetupConfig
from railway_setup.filters import identify_app_services
from railway_setup.guards import is_template_origin
from railway_setup import mutations as m
from railway_setup import queries as q


@dataclass
class SetupResult:
    project_name: str
    new_repo: str
    configured: list[dict[str, str]] = field(default_factory=list)
    messages: list[str] = field(default_factory=list)


def upsert_deployment_trigger(
    client: RailwayClient,
    *,
    config: SetupConfig,
    environment_id: str,
    service_id: str,
    branch: str,
    existing_trigger: dict[str, Any] | None,
    log: Callable[[str], None],
) -> None:
    if existing_trigger:
        current_branch = existing_trigger.get("branch")
        current_repo = existing_trigger.get("repository")
        if current_branch == branch and current_repo == config.new_repo:
            log(f"  trigger already set for {branch} @ {config.new_repo}")
            return
        log(f"  update trigger {existing_trigger['id']} -> {branch}")
        m.update_deployment_trigger(
            client,
            trigger_id=existing_trigger["id"],
            repository=config.new_repo,
            branch=branch,
            dry_run=config.dry_run,
        )
        return

    log(f"  create trigger -> {branch} @ {config.new_repo}")
    try:
        m.create_deployment_trigger(
            client,
            project_id=config.project_id,
            environment_id=environment_id,
            service_id=service_id,
            repository=config.new_repo,
            branch=branch,
            dry_run=config.dry_run,
        )
    except RailwayApiError as err:
        if "already exists" in str(err).lower() or "duplicate" in str(err).lower():
            log("  trigger already exists (auto-deploy should be active)")
            return
        raise


def configure_environment(
    client: RailwayClient,
    *,
    config: SetupConfig,
    env: dict[str, Any],
    branch: str,
    app_services: list[dict[str, Any]],
    log: Callable[[str], None],
    result: SetupResult,
) -> None:
    env_id = env["id"]
    env_name = env["name"]
    triggers = q.get_triggers_for_env(env)

    for service in app_services:
        service_id = service["id"]
        service_name = service["name"]
        log(f"[{env_name}] {service_name}")

        instance = q.fetch_service_instance(client, env_id, service_id)
        current_repo = (instance.get("source") or {}).get("repo")
        root_directory = instance.get("rootDirectory")

        if current_repo != config.new_repo:
            log(f"  set repo {current_repo!r} -> {config.new_repo!r}")
            m.update_service_repo(
                client,
                environment_id=env_id,
                service_id=service_id,
                repo=config.new_repo,
                root_directory=root_directory,
                dry_run=config.dry_run,
            )
        else:
            log(f"  repo already {config.new_repo}")

        trigger = q.find_trigger(triggers, service_id)
        upsert_deployment_trigger(
            client,
            config=config,
            environment_id=env_id,
            service_id=service_id,
            branch=branch,
            existing_trigger=trigger,
            log=log,
        )

        if trigger is None:
            log("  enable auto-deploy")
            m.enable_auto_deploy(
                client,
                project_id=config.project_id,
                environment_id=env_id,
                service_id=service_id,
                dry_run=config.dry_run,
            )
        else:
            log("  auto-deploy active (deployment trigger exists)")

        result.configured.append(
            {
                "environment": env_name,
                "service": service_name,
                "repo": config.new_repo,
                "branch": branch,
            }
        )


def commit_and_redeploy(
    client: RailwayClient,
    *,
    config: SetupConfig,
    env: dict[str, Any],
    app_services: list[dict[str, Any]],
    message: str,
    log: Callable[[str], None],
) -> None:
    env_id = env["id"]
    log(f"commit staged changes in {env['name']}")
    m.commit_staged(
        client,
        environment_id=env_id,
        message=message,
        dry_run=config.dry_run,
    )
    for service in app_services:
        log(f"redeploy {service['name']} in {env['name']}")
        m.redeploy_service(
            client,
            service_id=service["id"],
            environment_id=env_id,
            dry_run=config.dry_run,
        )


def duplicate_environment(
    client: RailwayClient,
    *,
    config: SetupConfig,
    prod_env: dict[str, Any],
    envs: list[dict[str, Any]],
    log: Callable[[str], None],
) -> dict[str, Any]:
    existing = q.find_by_name(envs, config.staging_name)
    if existing:
        log(f'staging environment "{config.staging_name}" already exists')
        return existing

    log(f'duplicate {prod_env["name"]} -> {config.staging_name}')
    try:
        return m.create_environment(
            client,
            project_id=config.project_id,
            name=config.staging_name,
            source_environment_id=prod_env["id"],
            dry_run=config.dry_run,
        )
    except RailwayApiError as err:
        log(f"environmentCreate hiccup (possible 504): {err}")
        log("polling for environment by name...")
        for _ in range(10):
            time.sleep(3)
            project = q.fetch_project(client, config.project_id)
            envs, _ = q.parse_project(project)
            found = q.find_by_name(envs, config.staging_name)
            if found:
                return found
        raise RuntimeError(
            f'Could not confirm environment "{config.staging_name}" was created.'
        ) from err


def assert_railway_not_template_only(
    *,
    config: SetupConfig,
    app_services: list[dict[str, Any]],
    prod_env: dict[str, Any],
    client: RailwayClient,
) -> None:
    """Abort if production still points at template origin and target is also template."""
    if config.allow_template_origin:
        return
    if not is_template_origin(config.new_repo, config.template_origin_repo):
        return

    for service in app_services:
        instance = q.fetch_service_instance(
            client, prod_env["id"], service["id"]
        )
        repo = (instance.get("source") or {}).get("repo")
        if repo and is_template_origin(repo, config.template_origin_repo):
            from railway_setup.guards import TemplateOriginError

            raise TemplateOriginError(
                "Production services still point at the template origin and "
                "NEW_REPO is also the template origin. Use your forked repo."
            )


def build_summary_table(rows: list[dict[str, str]]) -> str:
    if not rows:
        return "(no services configured)"
    headers = ("environment", "service", "repo", "branch")
    widths = {
        h: max(len(h), max(len(r[h]) for r in rows))
        for h in headers
    }
    lines = [
        "  ".join(h.ljust(widths[h]) for h in headers),
        "  ".join("-" * widths[h] for h in headers),
    ]
    for row in rows:
        lines.append("  ".join(row[h].ljust(widths[h]) for h in headers))
    return "\n".join(lines)


def run_setup(
    client: RailwayClient,
    config: SetupConfig,
    *,
    log: Callable[[str], None] | None = None,
) -> SetupResult:
    _log = log or print
    result = SetupResult(project_name="", new_repo=config.new_repo)

    me = q.fetch_me(client)
    _log(f"Authenticated as {me.get('name')} <{me.get('email')}>")

    project = q.fetch_project(client, config.project_id)
    result.project_name = project.get("name", config.project_id)
    envs, services = q.parse_project(project)

    prod_env = q.find_by_name(envs, config.prod_env_name)
    if not prod_env:
        raise ValueError(f'No "{config.prod_env_name}" environment found.')

    app_services = identify_app_services(services, config.app_services)
    if not app_services:
        names = ", ".join(s["name"] for s in services)
        raise ValueError(
            f"No services matched {list(config.app_services)}. Found: {names}"
        )

    assert_railway_not_template_only(
        config=config,
        app_services=app_services,
        prod_env=prod_env,
        client=client,
    )

    _log(
        f"Project {result.project_name} ({config.project_id}) -> {config.new_repo}"
    )
    _log(f"App services: {', '.join(s['name'] for s in app_services)}")

    configure_environment(
        client,
        config=config,
        env=prod_env,
        branch=config.prod_branch,
        app_services=app_services,
        log=_log,
        result=result,
    )
    commit_and_redeploy(
        client,
        config=config,
        env=prod_env,
        app_services=app_services,
        message=f"Repoint to {config.new_repo} @ {config.prod_branch}",
        log=_log,
    )

    if config.staging_branch:
        staging_env = duplicate_environment(
            client,
            config=config,
            prod_env=prod_env,
            envs=envs,
            log=_log,
        )
        project = q.fetch_project(client, config.project_id)
        envs, _ = q.parse_project(project)
        staging_env = q.find_by_name(envs, config.staging_name) or staging_env

        configure_environment(
            client,
            config=config,
            env=staging_env,
            branch=config.staging_branch,
            app_services=app_services,
            log=_log,
            result=result,
        )
        commit_and_redeploy(
            client,
            config=config,
            env=staging_env,
            app_services=app_services,
            message=f"Point {config.staging_name} at {config.staging_branch}",
            log=_log,
        )
    else:
        _log("staging skipped (--skip-staging or empty STAGING_BRANCH)")

    _log("\nDone. Configuration summary:")
    _log(build_summary_table(result.configured))
    return result
