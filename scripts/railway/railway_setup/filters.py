"""Identify app services to configure."""

from __future__ import annotations

from typing import Any


def identify_app_services(
    services: list[dict[str, Any]],
    app_service_names: tuple[str, ...],
) -> list[dict[str, Any]]:
    """Return services whose names match APP_SERVICES (case-insensitive)."""
    wanted = {name.lower() for name in app_service_names}
    matched = [
        s for s in services if s.get("name", "").lower() in wanted
    ]
    return matched
