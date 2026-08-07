"""Local filesystem storage for uploaded document artifacts."""

from __future__ import annotations

import os
import uuid
from pathlib import Path


def storage_root() -> Path:
    root = Path(os.getenv("DOC_STORAGE_DIR", "/data/documents"))
    root.mkdir(parents=True, exist_ok=True)
    return root


def save_artifact(repo_id: str, commit_id: str, filename: str, data: bytes) -> tuple[str, int]:
    safe_name = Path(filename).name or "upload.bin"
    rel = Path(repo_id) / commit_id / f"{uuid.uuid4().hex}_{safe_name}"
    path = storage_root() / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return str(rel).replace("\\", "/"), len(data)


def read_artifact(storage_path: str) -> bytes:
    path = storage_root() / storage_path
    if not path.is_file():
        raise FileNotFoundError(storage_path)
    return path.read_bytes()
