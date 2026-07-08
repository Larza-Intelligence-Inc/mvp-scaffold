#!/usr/bin/env python3
"""Thin wrapper so users can run: python scripts/railway/setup_project.py"""

from railway_setup.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
