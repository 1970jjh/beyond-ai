"""Tests for app.core.cache - SheetsCacheManager"""
import time

import pytest

from app.core.cache import CacheEntry, SheetsCacheManager


class TestCacheEntry:
    def test_not_expired_when_fresh(self):
        entry = CacheEntry(value="test", ttl=60)
        assert entry.is_expired is False

    def test_expired_after_ttl(self):
        entry = CacheEntry(value="test", ttl=0)
        # ttl=0 means no expiry (inf), but let's test with very small ttl
        entry.expires_at = time.monotonic() - 1  # force expired
        assert entry.is_expired is True

    def test_infinite_ttl_never_expires(self):
        entry = CacheEntry(value="test", ttl=0)
        assert entry.is_expired is False
        assert entry.expires_at == float("inf")


class TestSheetsCacheManager:
    def setup_method(self):
        self.cache = SheetsCacheManager()

    def test_get_returns_none_for_missing_key(self):
        assert self.cache.get("nonexistent") is None

    def test_set_and_get_value(self):
        self.cache.set("users:1", {"name": "Alice"}, ttl=60)
        result = self.cache.get("users:1")
        assert result == {"name": "Alice"}

    def test_get_expired_returns_none(self):
        self.cache.set("users:2", "data", ttl=60)
        # Force expiry
        self.cache._store["users:2"].expires_at = time.monotonic() - 1
        assert self.cache.get("users:2") is None

    def test_expired_entry_cleaned_on_get(self):
        self.cache.set("users:3", "data", ttl=60)
        self.cache._store["users:3"].expires_at = time.monotonic() - 1
        self.cache.get("users:3")
        assert "users:3" not in self.cache._store

    def test_activity_logs_not_cached(self):
        self.cache.set("activity_logs:all", [{"id": 1}])
        assert self.cache.get("activity_logs:all") is None

    def test_invalidate_clears_worksheet_keys(self):
        self.cache.set("users:a", "1", ttl=60)
        self.cache.set("users:b", "2", ttl=60)
        self.cache.set("rooms:x", "3", ttl=60)
        self.cache.invalidate("users")
        assert self.cache.get("users:a") is None
        assert self.cache.get("users:b") is None
        assert self.cache.get("rooms:x") == "3"

    def test_invalidate_all_clears_everything(self):
        self.cache.set("users:1", "u", ttl=60)
        self.cache.set("rooms:1", "r", ttl=60)
        self.cache.invalidate_all()
        assert len(self.cache._store) == 0

    def test_cleanup_expired_removes_stale_entries(self):
        self.cache.set("users:1", "a", ttl=60)
        self.cache.set("users:2", "b", ttl=60)
        self.cache._store["users:2"].expires_at = time.monotonic() - 1
        removed = self.cache.cleanup_expired()
        assert removed == 1
        assert "users:1" in self.cache._store
        assert "users:2" not in self.cache._store

    def test_ttl_config_applied_by_worksheet(self):
        self.cache.set("auth_admins:all", ["admin1"])
        entry = self.cache._store.get("auth_admins:all")
        assert entry is not None
        # auth_admins TTL = 300 seconds
        expected_min = time.monotonic() + 290
        assert entry.expires_at >= expected_min

    def test_default_ttl_for_unknown_key(self):
        self.cache.set("unknown_sheet:123", "data")
        entry = self.cache._store.get("unknown_sheet:123")
        assert entry is not None
        # default TTL = 30 seconds
        expected_min = time.monotonic() + 25
        assert entry.expires_at >= expected_min

    def test_explicit_ttl_overrides_config(self):
        self.cache.set("auth_admins:test", "data", ttl=5)
        entry = self.cache._store.get("auth_admins:test")
        assert entry is not None
        # Should be ~5s not 300s
        expected_max = time.monotonic() + 10
        assert entry.expires_at <= expected_max

    def test_overwrite_existing_key(self):
        self.cache.set("users:1", "old", ttl=60)
        self.cache.set("users:1", "new", ttl=60)
        assert self.cache.get("users:1") == "new"
