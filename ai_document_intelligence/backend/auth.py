"""Supabase / GoTrue JWT validation for FastAPI routes."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    id: str
    email: Optional[str] = None
    role: str = "authenticated"


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "").strip()
    if not secret:
        raise RuntimeError("JWT_SECRET is required for authenticated doc routes")
    return secret


def _jwt_issuer() -> str:
    return os.getenv("JWT_ISSUER", "http://localhost:54321/auth/v1").strip()


def _jwt_audience() -> str:
    return os.getenv("JWT_AUDIENCE", "authenticated").strip()


def decode_token(token: str) -> AuthUser:
    try:
        payload = jwt.decode(
            token,
            _jwt_secret(),
            algorithms=["HS256"],
            audience=_jwt_audience(),
            issuer=_jwt_issuer(),
            options={"require": ["sub", "exp"]},
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc

    role = str(payload.get("role", ""))
    if role != "authenticated":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated user role required",
        )
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub claim")
    return AuthUser(id=str(sub), email=payload.get("email"), role=role)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> AuthUser:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )
    return decode_token(creds.credentials)
