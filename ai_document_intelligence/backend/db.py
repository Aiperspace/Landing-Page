"""Postgres connections for document versioning."""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator

import psycopg
from psycopg.rows import dict_row


def database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "db")
    port = os.getenv("POSTGRES_PORT", "5432")
    user = os.getenv("POSTGRES_USER", "postgres")
    dbname = os.getenv("POSTGRES_DB", "postgres")
    return f"postgresql://{user}:{password}@{host}:{port}/{dbname}"


@contextmanager
def db_cursor() -> Generator[psycopg.Cursor, None, None]:
    with psycopg.connect(database_url(), row_factory=dict_row, autocommit=False) as conn:
        with conn.cursor() as cur:
            try:
                yield cur
                conn.commit()
            except Exception:
                conn.rollback()
                raise


def close_pool() -> None:
    """No-op kept for app shutdown hook compatibility."""
    return None
