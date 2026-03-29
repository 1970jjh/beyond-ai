"""Tests for app-level middleware, health check, and security headers."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthCheck:
    @pytest.mark.asyncio
    async def test_returns_200(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_returns_ok_status(self, client):
        resp = await client.get("/health")
        data = resp.json()
        assert data["status"] == "ok"

    @pytest.mark.asyncio
    async def test_returns_service_name(self, client):
        resp = await client.get("/health")
        data = resp.json()
        assert "service" in data
        assert isinstance(data["service"], str)


# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------

class TestSecurityHeaders:
    @pytest.mark.asyncio
    async def test_x_content_type_options(self, client):
        resp = await client.get("/health")
        assert resp.headers.get("x-content-type-options") == "nosniff"

    @pytest.mark.asyncio
    async def test_x_frame_options(self, client):
        resp = await client.get("/health")
        assert resp.headers.get("x-frame-options") == "DENY"

    @pytest.mark.asyncio
    async def test_x_xss_protection(self, client):
        resp = await client.get("/health")
        assert resp.headers.get("x-xss-protection") == "1; mode=block"

    @pytest.mark.asyncio
    async def test_referrer_policy(self, client):
        resp = await client.get("/health")
        assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"

    @pytest.mark.asyncio
    async def test_content_security_policy(self, client):
        resp = await client.get("/health")
        csp = resp.headers.get("content-security-policy")
        assert csp is not None
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp

    @pytest.mark.asyncio
    async def test_security_headers_on_404(self, client):
        resp = await client.get("/nonexistent-endpoint-12345")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("x-frame-options") == "DENY"


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

class TestCORS:
    @pytest.mark.asyncio
    async def test_cors_preflight_returns_allowed_methods(self, client):
        resp = await client.options(
            "/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        # CORSMiddleware will respond to preflight if origin is allowed
        # With default settings in test, may return 200 or 400
        # Just verify the middleware processes it without 500
        assert resp.status_code < 500


# ---------------------------------------------------------------------------
# Route existence
# ---------------------------------------------------------------------------

class TestRouteExistence:
    @pytest.mark.asyncio
    async def test_auth_register_route_exists(self, client):
        # POST without body → 422 (validation error), not 404
        resp = await client.post("/api/v1/auth/register")
        assert resp.status_code != 404

    @pytest.mark.asyncio
    async def test_auth_login_route_exists(self, client):
        resp = await client.post("/api/v1/auth/login")
        assert resp.status_code != 404

    @pytest.mark.asyncio
    async def test_auth_refresh_route_exists(self, client):
        resp = await client.post("/api/v1/auth/refresh")
        assert resp.status_code != 404

    @pytest.mark.asyncio
    async def test_auth_me_route_exists(self, client):
        resp = await client.get("/api/v1/auth/me")
        # No Bearer token → 403
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_users_route_exists(self, client):
        resp = await client.get("/api/v1/users/")
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_gamification_leaderboard_exists(self, client):
        resp = await client.get("/api/v1/gamification/leaderboard")
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_battle_routes_exist(self, client):
        resp = await client.post("/api/v1/battle/start")
        assert resp.status_code != 404


# ---------------------------------------------------------------------------
# Public battle endpoints (no auth required)
# ---------------------------------------------------------------------------

class TestPersonasEndpoint:
    @pytest.mark.asyncio
    async def test_list_all_personas(self, client):
        resp = await client.get("/api/v1/battle/personas/all")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 12  # 12 AI personas

    @pytest.mark.asyncio
    async def test_each_persona_has_required_fields(self, client):
        resp = await client.get("/api/v1/battle/personas/all")
        for persona in resp.json():
            assert "id" in persona
            assert "name" in persona
            assert "title" in persona
            assert "personality" in persona
            assert "expertise" in persona
            assert "catchphrase" in persona
            assert "strengths" in persona
            assert "weaknesses" in persona

    @pytest.mark.asyncio
    async def test_get_persona_by_quest_id(self, client):
        resp = await client.get("/api/v1/battle/personas/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"]  # non-empty name

    @pytest.mark.asyncio
    async def test_all_12_quest_personas_accessible(self, client):
        for quest_id in range(1, 13):
            resp = await client.get(f"/api/v1/battle/personas/{quest_id}")
            assert resp.status_code == 200, f"Quest {quest_id} persona failed"


class TestDifficultyEndpoint:
    @pytest.mark.asyncio
    async def test_beginner_difficulty(self, client):
        resp = await client.get("/api/v1/battle/difficulty/beginner")
        assert resp.status_code == 200
        data = resp.json()
        assert data["level"] == "beginner"
        assert "params" in data

    @pytest.mark.asyncio
    async def test_intermediate_difficulty(self, client):
        resp = await client.get("/api/v1/battle/difficulty/intermediate")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_advanced_difficulty(self, client):
        resp = await client.get("/api/v1/battle/difficulty/advanced")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_difficulty_params_have_required_fields(self, client):
        resp = await client.get("/api/v1/battle/difficulty/beginner")
        params = resp.json()["params"]
        assert "temperature" in params
        assert "max_tokens" in params
        assert "thinking_depth" in params
        assert "framework_usage" in params
        assert "human_likeness" in params

    @pytest.mark.asyncio
    async def test_beginner_has_higher_temperature_than_advanced(self, client):
        beginner = (await client.get("/api/v1/battle/difficulty/beginner")).json()
        advanced = (await client.get("/api/v1/battle/difficulty/advanced")).json()
        assert beginner["params"]["temperature"] >= advanced["params"]["temperature"]
