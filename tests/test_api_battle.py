"""Integration tests for auth-protected battle API routes using dependency overrides."""
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.deps import get_current_user
from app.core.database import get_db
from app.main import app
from app.models.battle import BattleMode, BattleResult, BattleStatus
from app.models.user import UserRole


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FAKE_USER_ID = uuid.uuid4()
FAKE_TENANT_ID = uuid.uuid4()


def _fake_user() -> MagicMock:
    user = MagicMock()
    user.id = FAKE_USER_ID
    user.tenant_id = FAKE_TENANT_ID
    user.email = "test@beyond-ai.kr"
    user.display_name = "Test User"
    user.role = UserRole.LEARNER
    user.is_active = True
    return user


def _fake_battle(
    *,
    battle_id: uuid.UUID | None = None,
    status: BattleStatus = BattleStatus.IN_PROGRESS,
    result: BattleResult = BattleResult.IN_PROGRESS,
    mode: BattleMode = BattleMode.COMPETITION,
) -> MagicMock:
    battle = MagicMock()
    battle.id = battle_id or uuid.uuid4()
    battle.quest_id = 1
    battle.user_id = FAKE_USER_ID
    battle.status = status
    battle.result = result
    battle.mode = mode
    battle.difficulty = "intermediate"
    battle.task_description = "Test battle task description"
    battle.human_submission = None
    battle.ai_submission = None
    battle.human_score_total = None
    battle.ai_score_total = None
    battle.human_score_quality = None
    battle.human_score_creativity = None
    battle.human_score_execution = None
    battle.human_score_efficiency = None
    battle.ai_score_quality = None
    battle.ai_score_creativity = None
    battle.ai_score_execution = None
    battle.ai_score_efficiency = None
    battle.human_feedback = None
    battle.ai_feedback = None
    battle.comparison = None
    battle.time_limit_sec = 3600
    battle.hint_count = 0
    battle.ai_provider = None
    battle.started_at = datetime.now(UTC)
    battle.submitted_at = None
    battle.completed_at = None
    battle.created_at = datetime.now(UTC)
    return battle


@pytest.fixture
def fake_db():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.execute = AsyncMock()
    db.commit = AsyncMock()
    return db


@pytest.fixture
def auth_client(fake_db):
    """Client with overridden auth + db deps."""
    fake_user = _fake_user()

    async def override_get_current_user():
        return fake_user

    async def override_get_db():
        yield fake_db

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    yield fake_user, fake_db
    app.dependency_overrides.clear()


@pytest.fixture
async def client(auth_client):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        headers={"Authorization": "Bearer fake-token"},
    ) as c:
        yield c


# ---------------------------------------------------------------------------
# POST /api/v1/battle/start
# ---------------------------------------------------------------------------

class TestStartBattle:
    @pytest.mark.asyncio
    async def test_start_returns_201(self, client, auth_client):
        fake_user, fake_db = auth_client
        battle = _fake_battle()

        async def mock_refresh(obj):
            obj.id = battle.id
            obj.status = BattleStatus.IN_PROGRESS
            obj.result = BattleResult.IN_PROGRESS
            obj.mode = BattleMode.COMPETITION
            obj.difficulty = "intermediate"
            obj.task_description = "Create a marketing strategy for new product launch"
            obj.human_submission = None
            obj.ai_submission = None
            obj.human_score_total = None
            obj.ai_score_total = None
            obj.human_score_quality = None
            obj.human_score_creativity = None
            obj.human_score_execution = None
            obj.human_score_efficiency = None
            obj.ai_score_quality = None
            obj.ai_score_creativity = None
            obj.ai_score_execution = None
            obj.ai_score_efficiency = None
            obj.human_feedback = None
            obj.ai_feedback = None
            obj.comparison = None
            obj.time_limit_sec = 3600
            obj.hint_count = 0
            obj.ai_provider = None
            obj.quest_id = 1

        fake_db.refresh = AsyncMock(side_effect=mock_refresh)

        with patch("app.api.v1.battle.Battle", return_value=MagicMock()), \
             patch("app.api.v1.battle._generate_ai_submission", new_callable=AsyncMock):
            resp = await client.post("/api/v1/battle/start", json={
                "quest_id": 1,
                "task_description": "Create a marketing strategy for new product launch",
                "difficulty": "beginner",
            })
        assert resp.status_code == 201
        data = resp.json()
        assert data["quest_id"] == 1
        assert data["status"] == "in_progress"
        assert data["mode"] == "competition"

    @pytest.mark.asyncio
    async def test_start_validates_quest_id_too_high(self, client, auth_client):
        resp = await client.post("/api/v1/battle/start", json={
            "quest_id": 99,
            "task_description": "Invalid quest id test case",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_start_validates_quest_id_too_low(self, client, auth_client):
        resp = await client.post("/api/v1/battle/start", json={
            "quest_id": 0,
            "task_description": "Invalid quest id test case",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_start_validates_description_too_short(self, client, auth_client):
        resp = await client.post("/api/v1/battle/start", json={
            "quest_id": 1,
            "task_description": "short",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_start_validates_invalid_difficulty(self, client, auth_client):
        resp = await client.post("/api/v1/battle/start", json={
            "quest_id": 1,
            "task_description": "Test battle valid description here",
            "difficulty": "impossible",
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /api/v1/battle/{battle_id}  — patching _get_battle
# ---------------------------------------------------------------------------

class TestGetBattle:
    @pytest.mark.asyncio
    async def test_get_battle_returns_data(self, client, auth_client):
        battle = _fake_battle()

        with patch("app.api.v1.battle._get_battle", new_callable=AsyncMock, return_value=battle):
            resp = await client.get(f"/api/v1/battle/{battle.id}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == str(battle.id)
        assert data["status"] == "in_progress"
        assert data["difficulty"] == "intermediate"

    @pytest.mark.asyncio
    async def test_get_battle_not_found(self, client, auth_client):
        from fastapi import HTTPException

        async def raise_not_found(*args, **kwargs):
            raise HTTPException(status_code=404, detail="Battle not found")

        with patch("app.api.v1.battle._get_battle", side_effect=raise_not_found):
            resp = await client.get(f"/api/v1/battle/{uuid.uuid4()}")

        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/v1/battle/{battle_id}/mode
# ---------------------------------------------------------------------------

class TestSwitchMode:
    @pytest.mark.asyncio
    async def test_switch_mode_success(self, client, auth_client):
        battle = _fake_battle(status=BattleStatus.IN_PROGRESS)

        with patch("app.api.v1.battle._get_battle", new_callable=AsyncMock, return_value=battle):
            resp = await client.post(f"/api/v1/battle/{battle.id}/mode", json={
                "mode": "coach",
            })

        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_switch_mode_invalid_mode_422(self, client, auth_client):
        resp = await client.post(f"/api/v1/battle/{uuid.uuid4()}/mode", json={
            "mode": "invalid_mode",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_switch_mode_completed_battle_400(self, client, auth_client):
        battle = _fake_battle(status=BattleStatus.COMPLETED)

        with patch("app.api.v1.battle._get_battle", new_callable=AsyncMock, return_value=battle):
            resp = await client.post(f"/api/v1/battle/{battle.id}/mode", json={
                "mode": "coach",
            })

        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# GET /api/v1/battle/my — requires real DB query, test via route existence
# ---------------------------------------------------------------------------

class TestMyBattlesRoute:
    @pytest.mark.asyncio
    async def test_my_battles_route_requires_auth(self):
        """Without auth override, /my returns 403."""
        app.dependency_overrides.clear()
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as c:
            resp = await c.get("/api/v1/battle/my")
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# POST /api/v1/battle/{battle_id}/submit
# ---------------------------------------------------------------------------

class TestSubmitBattle:
    @pytest.mark.asyncio
    async def test_submit_completed_battle_fails(self, client, auth_client):
        battle = _fake_battle(status=BattleStatus.COMPLETED)

        with patch("app.api.v1.battle._get_battle", new_callable=AsyncMock, return_value=battle):
            resp = await client.post(f"/api/v1/battle/{battle.id}/submit", json={
                "submission": "My answer to the quest challenge",
            })

        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_submit_empty_submission_422(self, client, auth_client):
        resp = await client.post(f"/api/v1/battle/{uuid.uuid4()}/submit", json={
            "submission": "",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_submit_no_body_422(self, client, auth_client):
        resp = await client.post(f"/api/v1/battle/{uuid.uuid4()}/submit")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/v1/battle/{battle_id}/coach
# ---------------------------------------------------------------------------

class TestCoachRoute:
    @pytest.mark.asyncio
    async def test_coach_validates_empty_question(self, client, auth_client):
        resp = await client.post(f"/api/v1/battle/{uuid.uuid4()}/coach", json={
            "question": "",
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/v1/battle/{battle_id}/review
# ---------------------------------------------------------------------------

class TestReviewRoute:
    @pytest.mark.asyncio
    async def test_review_validates_empty_submission(self, client, auth_client):
        resp = await client.post(f"/api/v1/battle/{uuid.uuid4()}/review", json={
            "submission": "",
        })
        assert resp.status_code == 422
