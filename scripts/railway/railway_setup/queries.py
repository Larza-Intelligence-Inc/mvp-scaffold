"""GraphQL queries."""

from __future__ import annotations

from typing import Any

from railway_setup.client import RailwayClient

PROJECT_QUERY = """
query project($id: String!) {
  project(id: $id) {
    id
    name
    environments {
      edges {
        node {
          id
          name
          deploymentTriggers {
            edges {
              node {
                id
                branch
                repository
                serviceId
                provider
                checkSuites
              }
            }
          }
        }
      }
    }
    services {
      edges {
        node {
          id
          name
        }
      }
    }
  }
}
"""

ME_QUERY = """
query {
  me {
    name
    email
  }
}
"""

SERVICE_INSTANCE_QUERY = """
query serviceInstance($environmentId: String!, $serviceId: String!) {
  serviceInstance(environmentId: $environmentId, serviceId: $serviceId) {
    id
    rootDirectory
    source {
      repo
      image
    }
  }
}
"""


def fetch_me(client: RailwayClient) -> dict[str, Any]:
    data = client.gql(ME_QUERY)
    return data["me"]


def fetch_project(client: RailwayClient, project_id: str) -> dict[str, Any]:
    data = client.gql(PROJECT_QUERY, {"id": project_id})
    project = data.get("project")
    if not project:
        raise ValueError(f"Project {project_id} not found.")
    return project


def parse_project(project: dict[str, Any]) -> tuple[list[dict], list[dict]]:
    envs = [e["node"] for e in project["environments"]["edges"]]
    services = [s["node"] for s in project["services"]["edges"]]
    return envs, services


def find_by_name(items: list[dict[str, Any]], name: str) -> dict[str, Any] | None:
    target = name.lower()
    for item in items:
        if item.get("name", "").lower() == target:
            return item
    return None


def get_triggers_for_env(env: dict[str, Any]) -> list[dict[str, Any]]:
    return [t["node"] for t in env["deploymentTriggers"]["edges"]]


def find_trigger(
    triggers: list[dict[str, Any]], service_id: str
) -> dict[str, Any] | None:
    for trigger in triggers:
        if trigger.get("serviceId") == service_id:
            return trigger
    return None


def fetch_service_instance(
    client: RailwayClient, environment_id: str, service_id: str
) -> dict[str, Any]:
    data = client.gql(
        SERVICE_INSTANCE_QUERY,
        {"environmentId": environment_id, "serviceId": service_id},
    )
    return data["serviceInstance"]
