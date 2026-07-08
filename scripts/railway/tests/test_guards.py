"""Unit tests for template-origin guards."""

from __future__ import annotations

import pytest

from railway_setup.guards import (
    TemplateOriginError,
    assert_not_template_origin,
    is_template_origin,
    parse_github_remote,
    validate_repo_format,
)


@pytest.mark.parametrize(
    "url,expected",
    [
        ("git@github.com:acme/my-app.git", "acme/my-app"),
        ("https://github.com/acme/my-app.git", "acme/my-app"),
        ("https://github.com/acme/my-app", "acme/my-app"),
        ("git@github.com:Larza-Intelligence-Inc/test-scaffold.git", "Larza-Intelligence-Inc/test-scaffold"),
    ],
)
def test_parse_github_remote(url: str, expected: str) -> None:
    assert parse_github_remote(url) == expected


def test_parse_github_remote_non_github() -> None:
    assert parse_github_remote("git@gitlab.com:acme/my-app.git") is None


def test_is_template_origin() -> None:
    assert is_template_origin("Larza-Intelligence-Inc/mvp-scaffold")
    assert is_template_origin("larza-intelligence-inc/mvp-scaffold")
    assert not is_template_origin("acme/my-app")


def test_assert_not_template_origin_blocks() -> None:
    with pytest.raises(TemplateOriginError, match="template origin"):
        assert_not_template_origin("Larza-Intelligence-Inc/mvp-scaffold")


def test_assert_not_template_origin_allows_fork() -> None:
    assert_not_template_origin("acme/my-app")


def test_assert_not_template_origin_escape_hatch() -> None:
    assert_not_template_origin(
        "Larza-Intelligence-Inc/mvp-scaffold",
        allow_template_origin=True,
    )


def test_validate_repo_format() -> None:
    validate_repo_format("owner/repo")
    with pytest.raises(ValueError):
        validate_repo_format("bad")
