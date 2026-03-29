"""Tests for app.core.security"""
import time

import pytest

from app.core.security import (
    ROLE_HIERARCHY,
    create_access_token,
    create_refresh_token,
    decode_token,
    has_permission,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_differs_from_plain(self):
        plain = "MyP@ssw0rd!"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_verify_correct_password(self):
        plain = "MyP@ssw0rd!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_same_password_different_hashes(self):
        plain = "MyP@ssw0rd!"
        assert hash_password(plain) != hash_password(plain)


class TestJWTTokens:
    def test_access_token_roundtrip(self):
        data = {"sub": "user-123", "role": "learner"}
        token = create_access_token(data)
        decoded = decode_token(token)
        assert decoded is not None
        assert decoded["sub"] == "user-123"
        assert decoded["type"] == "access"

    def test_refresh_token_type(self):
        data = {"sub": "user-456"}
        token = create_refresh_token(data)
        decoded = decode_token(token)
        assert decoded is not None
        assert decoded["type"] == "refresh"

    def test_decode_invalid_token_returns_none(self):
        assert decode_token("not.a.jwt") is None

    def test_decode_tampered_token_returns_none(self):
        token = create_access_token({"sub": "user-1"})
        tampered = token[:-5] + "xxxxx"
        assert decode_token(tampered) is None

    def test_token_contains_expiry(self):
        token = create_access_token({"sub": "user-1"})
        decoded = decode_token(token)
        assert "exp" in decoded
        assert decoded["exp"] > time.time()


class TestRoleHierarchy:
    def test_super_admin_has_highest_level(self):
        assert ROLE_HIERARCHY["super_admin"] > ROLE_HIERARCHY["admin"]
        assert ROLE_HIERARCHY["admin"] > ROLE_HIERARCHY["learner"]

    def test_super_admin_can_access_all(self):
        assert has_permission("super_admin", "admin") is True
        assert has_permission("super_admin", "learner") is True
        assert has_permission("super_admin", "super_admin") is True

    def test_admin_cannot_access_super_admin(self):
        assert has_permission("admin", "super_admin") is False

    def test_admin_can_access_learner(self):
        assert has_permission("admin", "learner") is True

    def test_learner_cannot_access_admin(self):
        assert has_permission("learner", "admin") is False

    def test_learner_can_access_own_level(self):
        assert has_permission("learner", "learner") is True

    def test_unknown_role_has_no_permission(self):
        assert has_permission("unknown_role", "learner") is False
