"""Resolve application assets separately from the caller's working directory."""

import os
from pathlib import Path


def project_root():
    override = os.environ.get("WORKWEAVE_ROOT")
    if override:
        return Path(override).expanduser().resolve()
    for parent in Path(__file__).resolve().parents:
        if (parent / "pyproject.toml").is_file():
            return parent
    return Path.cwd().resolve()


PROJECT_ROOT = project_root()
FRONTEND_DIR = PROJECT_ROOT / "frontend" / "dist"
