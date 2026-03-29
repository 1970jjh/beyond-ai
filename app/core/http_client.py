"""Singleton httpx.AsyncClient instances per AI provider."""

from __future__ import annotations

import httpx

_clients: dict[str, httpx.AsyncClient] = {}


def get_http_client(provider: str, *, timeout: float = 120) -> httpx.AsyncClient:
    """Return a reusable AsyncClient for the given provider key."""
    if provider not in _clients or _clients[provider].is_closed:
        _clients[provider] = httpx.AsyncClient(timeout=timeout)
    return _clients[provider]


async def close_all_clients() -> None:
    """Close all cached clients. Call on app shutdown."""
    for client in _clients.values():
        if not client.is_closed:
            await client.aclose()
    _clients.clear()
