"""Thin GraphQL client for the Railway Public API."""

from __future__ import annotations

import json
from typing import Any

import httpx

API_URL = "https://backboard.railway.com/graphql/v2"


class RailwayApiError(Exception):
    """GraphQL or HTTP error from Railway."""


class RailwayClient:
    def __init__(self, token: str, *, transport: httpx.BaseTransport | None = None):
        self._token = token
        self._client = httpx.Client(
            base_url=API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
            timeout=120.0,
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> RailwayClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def gql(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        response = self._client.post(
            "",
            json={"query": query, "variables": variables or {}},
        )
        if response.status_code >= 400:
            raise RailwayApiError(
                f"HTTP {response.status_code}: {response.text[:500]}"
            )
        payload = response.json()
        if payload.get("errors"):
            msg = json.dumps(payload["errors"], indent=2)
            if "does not have access" in msg:
                raise RailwayApiError(
                    "Railway can't access the GitHub repo. Connect GitHub to Railway "
                    "and grant access to your fork.\n" + msg
                )
            raise RailwayApiError(f"GraphQL error:\n{msg}")
        return payload.get("data") or {}
