"""GraphQL mutations."""

from __future__ import annotations

from typing import Any

from railway_setup.client import RailwayApiError, RailwayClient

SERVICE_INSTANCE_UPDATE = """
mutation serviceInstanceUpdate(
  $environmentId: String!
  $serviceId: String!
  $input: ServiceInstanceUpdateInput!
) {
  serviceInstanceUpdate(
    environmentId: $environmentId
    serviceId: $serviceId
    input: $input
  )
}
"""

DEPLOYMENT_TRIGGER_CREATE = """
mutation deploymentTriggerCreate($input: DeploymentTriggerCreateInput!) {
  deploymentTriggerCreate(input: $input) {
    id
    branch
    repository
  }
}
"""

DEPLOYMENT_TRIGGER_UPDATE = """
mutation deploymentTriggerUpdate(
  $id: String!
  $input: DeploymentTriggerUpdateInput!
) {
  deploymentTriggerUpdate(id: $id, input: $input) {
    id
    branch
    repository
  }
}
"""

SERVICE_INSTANCE_AUTO_DEPLOY_UPDATE = """
mutation serviceInstanceAutoDeployUpdate(
  $input: ServiceInstanceAutoDeployUpdateInput!
) {
  serviceInstanceAutoDeployUpdate(input: $input) {
    enabled
  }
}
"""

ENVIRONMENT_CREATE = """
mutation environmentCreate($input: EnvironmentCreateInput!) {
  environmentCreate(input: $input) {
    id
    name
  }
}
"""

ENVIRONMENT_PATCH_COMMIT_STAGED = """
mutation environmentPatchCommitStaged(
  $environmentId: String!
  $commitMessage: String
) {
  environmentPatchCommitStaged(
    environmentId: $environmentId
    commitMessage: $commitMessage
  )
}
"""

SERVICE_INSTANCE_REDEPLOY = """
mutation serviceInstanceRedeploy(
  $serviceId: String!
  $environmentId: String!
) {
  serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
}
"""


def update_service_repo(
    client: RailwayClient,
    *,
    environment_id: str,
    service_id: str,
    repo: str,
    root_directory: str | None,
    dry_run: bool,
) -> None:
    input_data: dict[str, Any] = {"source": {"repo": repo}}
    if root_directory is not None:
        input_data["rootDirectory"] = root_directory
    if dry_run:
        return
    client.gql(
        SERVICE_INSTANCE_UPDATE,
        {
            "environmentId": environment_id,
            "serviceId": service_id,
            "input": input_data,
        },
    )


def create_deployment_trigger(
    client: RailwayClient,
    *,
    project_id: str,
    environment_id: str,
    service_id: str,
    repository: str,
    branch: str,
    dry_run: bool,
) -> dict[str, Any] | None:
    if dry_run:
        return {"id": "dry-run"}
    data = client.gql(
        DEPLOYMENT_TRIGGER_CREATE,
        {
            "input": {
                "projectId": project_id,
                "environmentId": environment_id,
                "serviceId": service_id,
                "repository": repository,
                "branch": branch,
                "provider": "github",
            }
        },
    )
    return data.get("deploymentTriggerCreate")


def update_deployment_trigger(
    client: RailwayClient,
    *,
    trigger_id: str,
    repository: str,
    branch: str,
    dry_run: bool,
) -> dict[str, Any] | None:
    if dry_run:
        return {"id": trigger_id}
    data = client.gql(
        DEPLOYMENT_TRIGGER_UPDATE,
        {
            "id": trigger_id,
            "input": {"repository": repository, "branch": branch},
        },
    )
    return data.get("deploymentTriggerUpdate")


def enable_auto_deploy(
    client: RailwayClient,
    *,
    project_id: str,
    environment_id: str,
    service_id: str,
    dry_run: bool,
) -> None:
    if dry_run:
        return
    try:
        client.gql(
            SERVICE_INSTANCE_AUTO_DEPLOY_UPDATE,
            {
                "input": {
                    "projectId": project_id,
                    "environmentId": environment_id,
                    "serviceId": service_id,
                    "enabled": True,
                }
            },
        )
    except RailwayApiError as err:
        if "single deployment trigger" in str(err).lower():
            return
        raise


def create_environment(
    client: RailwayClient,
    *,
    project_id: str,
    name: str,
    source_environment_id: str,
    dry_run: bool,
) -> dict[str, Any]:
    if dry_run:
        return {"id": "dry-run-env", "name": name}
    data = client.gql(
        ENVIRONMENT_CREATE,
        {
            "input": {
                "name": name,
                "projectId": project_id,
                "sourceEnvironmentId": source_environment_id,
            }
        },
    )
    return data["environmentCreate"]


def commit_staged(
    client: RailwayClient,
    *,
    environment_id: str,
    message: str,
    dry_run: bool,
) -> None:
    if dry_run:
        return
    try:
        client.gql(
            ENVIRONMENT_PATCH_COMMIT_STAGED,
            {"environmentId": environment_id, "commitMessage": message},
        )
    except Exception:
        pass


def redeploy_service(
    client: RailwayClient,
    *,
    service_id: str,
    environment_id: str,
    dry_run: bool,
) -> None:
    if dry_run:
        return
    client.gql(
        SERVICE_INSTANCE_REDEPLOY,
        {"serviceId": service_id, "environmentId": environment_id},
    )
