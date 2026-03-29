from __future__ import annotations

import time
from typing import Any


class CacheEntry:
    __slots__ = ("value", "expires_at")

    def __init__(self, value: Any, ttl: int) -> None:
        self.value = value
        self.expires_at = time.monotonic() + ttl if ttl > 0 else float("inf")

    @property
    def is_expired(self) -> bool:
        return time.monotonic() > self.expires_at


class SheetsCacheManager:
    """In-memory TTL cache replacing Redis for Google Sheets data."""

    TTL_CONFIG: dict[str, int] = {
        "auth_admins": 300,
        "users": 60,
        "rooms": 15,
        "room_participants": 15,
        "quest_results": 30,
        "activity_logs": 0,
        "dashboard_stats": 120,
    }

    def __init__(self) -> None:
        self._store: dict[str, CacheEntry] = {}

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None or entry.is_expired:
            self._store.pop(key, None)
            return None
        return entry.value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        resolved_ttl = ttl if ttl is not None else self._resolve_ttl(key)
        if resolved_ttl == 0:
            return
        self._store[key] = CacheEntry(value, resolved_ttl)

    def invalidate(self, worksheet: str) -> None:
        prefix = f"{worksheet}:"
        keys_to_remove = [k for k in self._store if k.startswith(prefix) or k == worksheet]
        for k in keys_to_remove:
            del self._store[k]

    def invalidate_all(self) -> None:
        self._store.clear()

    def _resolve_ttl(self, key: str) -> int:
        for sheet_name, ttl in self.TTL_CONFIG.items():
            if key.startswith(sheet_name):
                return ttl
        return 30

    def cleanup_expired(self) -> int:
        expired = [k for k, v in self._store.items() if v.is_expired]
        for k in expired:
            del self._store[k]
        return len(expired)


cache = SheetsCacheManager()
