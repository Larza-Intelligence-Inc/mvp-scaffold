"""CLI entry point for railway-setup."""

from __future__ import annotations

import argparse
import sys

from railway_setup.client import RailwayApiError, RailwayClient
from railway_setup.config import SetupConfig
from railway_setup.guards import TemplateOriginError
from railway_setup.setup import run_setup


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Configure a Railway project deployed from the mvp-scaffold template "
            "to use YOUR forked GitHub repo (production + optional staging)."
        ),
        epilog=(
            "Run from your forked repo root after one-click Railway deploy. "
            "Requires RAILWAY_API_TOKEN and PROJECT_ID."
        ),
    )
    parser.add_argument(
        "--repo",
        help="GitHub repo as owner/name (default: git remote origin)",
    )
    parser.add_argument(
        "--project-id",
        help="Railway project ID (default: PROJECT_ID env)",
    )
    parser.add_argument(
        "--token",
        help="Railway API token (default: RAILWAY_API_TOKEN env or token.md)",
    )
    parser.add_argument(
        "--skip-staging",
        action="store_true",
        help="Skip staging environment setup",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Log planned changes without mutating Railway",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        config = SetupConfig.from_env_and_args(
            repo=args.repo,
            project_id=args.project_id,
            token=args.token,
            skip_staging=args.skip_staging,
            dry_run=args.dry_run,
        )
    except (ValueError, TemplateOriginError, RuntimeError) as err:
        print(f"Error: {err}", file=sys.stderr)
        return 1

    if config.dry_run:
        print("DRY RUN — no Railway mutations will be performed\n")

    try:
        with RailwayClient(config.token) as client:
            run_setup(client, config)
    except (RailwayApiError, ValueError, RuntimeError, TemplateOriginError) as err:
        print(f"\nFailed:\n{err}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
