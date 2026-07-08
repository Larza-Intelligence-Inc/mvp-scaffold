"""Template-origin guards and git remote parsing."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

TEMPLATE_ORIGIN_REPO = "Larza-Intelligence-Inc/mvp-scaffold"

_GITHUB_REMOTE_RE = re.compile(
    r"(?:github\.com[:/])(?P<owner>[^/]+)/(?P<repo>[^/.\s]+?)(?:\.git)?/?$"
)


class TemplateOriginError(Exception):
    """Raised when the script would target the canonical template repo."""


def parse_github_remote(url: str) -> str | None:
    """Parse owner/repo from a git remote URL, or return None if not GitHub."""
    url = url.strip()
    match = _GITHUB_REMOTE_RE.search(url)
    if not match:
        return None
    return f"{match.group('owner')}/{match.group('repo')}"


def get_origin_repo(cwd: Path | None = None) -> str:
    """Return owner/repo from git remote origin in cwd."""
    result = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        cwd=cwd or Path.cwd(),
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(
            "Could not read git remote origin. Run from your forked repo root "
            "or pass --repo owner/repo explicitly."
        )
    repo = parse_github_remote(result.stdout)
    if not repo:
        raise RuntimeError(
            f"Origin is not a GitHub remote: {result.stdout.strip()!r}. "
            "Pass --repo owner/repo explicitly."
        )
    return repo


def is_template_origin(repo: str, template_origin: str = TEMPLATE_ORIGIN_REPO) -> bool:
    return repo.strip().lower() == template_origin.strip().lower()


def assert_not_template_origin(
    repo: str,
    *,
    template_origin: str = TEMPLATE_ORIGIN_REPO,
    allow_template_origin: bool = False,
) -> None:
    if allow_template_origin:
        return
    if is_template_origin(repo, template_origin):
        raise TemplateOriginError(
            f"This script configures YOUR fork of the template. "
            f"It cannot target the template origin ({template_origin}). "
            f"Create a repo from the GitHub template and run from that repo's root."
        )


def validate_repo_format(repo: str) -> None:
    parts = repo.split("/")
    if len(parts) != 2 or not all(parts):
        raise ValueError(f"Invalid repo format {repo!r}; expected owner/repo")
