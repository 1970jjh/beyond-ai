from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


class GoogleAuthError(Exception):
    pass


def get_login_url(state: str = "") -> str:
    """Generate Google OAuth2 login URL for user authentication.

    Only requests openid/email/profile scopes.
    Sheets access is handled via GAS - no Sheets scope needed here.
    """
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state

    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_code(code: str) -> dict[str, Any]:
    """Exchange authorization code for tokens."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
        )

    if response.status_code != 200:
        raise GoogleAuthError(f"Token exchange failed: {response.text}")

    return response.json()


async def get_user_info(access_token: str) -> dict[str, Any]:
    """Get user info from Google using access token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if response.status_code != 200:
        raise GoogleAuthError(f"User info request failed: {response.text}")

    data = response.json()
    return {
        "email": data.get("email", ""),
        "name": data.get("name", ""),
        "picture": data.get("picture", ""),
        "email_verified": data.get("email_verified", False),
    }


async def authenticate(code: str) -> dict[str, Any]:
    """Full OAuth2 flow: code -> tokens -> user info."""
    tokens = await exchange_code(code)
    access_token = tokens.get("access_token")
    if not access_token:
        raise GoogleAuthError("No access token in response")

    user_info = await get_user_info(access_token)
    return {
        **user_info,
        "google_access_token": access_token,
        "google_refresh_token": tokens.get("refresh_token", ""),
    }
