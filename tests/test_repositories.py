"""Tests for Sheets-backed repositories (auth, dashboard, quest, room, user)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.core.cache import cache
from app.repositories.auth_repo import AuthRepository
from app.repositories.dashboard_repo import DashboardRepository
from app.repositories.quest_repo import QuestResultRepository
from app.repositories.log_repo import ActivityLogRepository
from app.repositories.room_repo import RoomRepository, RoomParticipantRepository, generate_invite_code
from app.repositories.user_repo import UserRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _clear_cache():
    """Clear the in-memory cache before each test to prevent cross-test contamination."""
    cache.invalidate_all()
    yield
    cache.invalidate_all()


def _mock_gas_client():
    client = AsyncMock()
    client.read_all = AsyncMock(return_value=[])
    client.read_by_id = AsyncMock(return_value=None)
    client.read_by_field = AsyncMock(return_value=[])
    client.create = AsyncMock(side_effect=lambda ws, data: data)
    client.update = AsyncMock(side_effect=lambda ws, rid, data, **kw: data)
    client.delete = AsyncMock()
    client.batch_create = AsyncMock(side_effect=lambda ws, rows: rows)
    client.batch_update = AsyncMock()
    return client


# ---------------------------------------------------------------------------
# AuthRepository
# ---------------------------------------------------------------------------

class TestAuthRepository:
    @pytest.fixture
    def repo(self):
        return AuthRepository()

    @pytest.fixture
    def mock_repo(self):
        r = AuthRepository()
        r._client = _mock_gas_client()
        return r

    def test_init(self, repo):
        assert repo.worksheet_name == "auth_admins"
        assert repo.id_field == "email"

    @pytest.mark.asyncio
    async def test_find_admin_by_email_found(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[
            {"email": "admin@test.com", "role": "admin", "is_active": "TRUE"},
            {"email": "admin@test.com", "role": "admin", "is_active": "FALSE"},
        ])
        result = await mock_repo.find_admin_by_email("admin@test.com")
        assert result is not None
        assert result["is_active"] == "TRUE"

    @pytest.mark.asyncio
    async def test_find_admin_by_email_not_found(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[])
        result = await mock_repo.find_admin_by_email("nobody@test.com")
        assert result is None

    @pytest.mark.asyncio
    async def test_find_admin_inactive_only(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[
            {"email": "ex@test.com", "is_active": "FALSE"},
        ])
        result = await mock_repo.find_admin_by_email("ex@test.com")
        assert result is None

    @pytest.mark.asyncio
    async def test_is_admin(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[
            {"email": "admin@test.com", "is_active": "TRUE"},
        ])
        assert await mock_repo.is_admin("admin@test.com") is True

    @pytest.mark.asyncio
    async def test_is_not_admin(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[])
        assert await mock_repo.is_admin("nobody@test.com") is False

    @pytest.mark.asyncio
    async def test_get_role(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[
            {"email": "admin@test.com", "role": "super_admin", "is_active": "TRUE"},
        ])
        assert await mock_repo.get_role("admin@test.com") == "super_admin"

    @pytest.mark.asyncio
    async def test_get_role_none(self, mock_repo):
        mock_repo._client.read_by_field = AsyncMock(return_value=[])
        assert await mock_repo.get_role("nobody@test.com") is None

    @pytest.mark.asyncio
    async def test_add_admin(self, mock_repo):
        result = await mock_repo.add_admin("new@test.com", "admin", "New Admin", "ceo@test.com")
        assert result["email"] == "new@test.com"
        assert result["is_active"] == "TRUE"
        mock_repo._client.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_remove_admin(self, mock_repo):
        await mock_repo.remove_admin("old@test.com")
        mock_repo._client.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_list_active_admins(self, mock_repo):
        mock_repo._client.read_all = AsyncMock(return_value=[
            {"email": "a@t.com", "is_active": "TRUE"},
            {"email": "b@t.com", "is_active": "FALSE"},
            {"email": "c@t.com", "is_active": "TRUE"},
        ])
        result = await mock_repo.list_active_admins()
        assert len(result) == 2


# ---------------------------------------------------------------------------
# DashboardRepository
# ---------------------------------------------------------------------------

class TestDashboardRepository:
    @pytest.fixture
    def repo(self):
        r = DashboardRepository()
        r._client = _mock_gas_client()
        return r

    def test_init(self):
        r = DashboardRepository()
        assert r.worksheet_name == "dashboard_stats"
        assert r.id_field == "metric_key"

    @pytest.mark.asyncio
    async def test_get_metric_found(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"metric_key": "total_users", "metric_value": "42", "period": "all"},
        ])
        assert await repo.get_metric("total_users") == "42"

    @pytest.mark.asyncio
    async def test_get_metric_wrong_period(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"metric_key": "total_users", "metric_value": "42", "period": "monthly"},
        ])
        assert await repo.get_metric("total_users", "all") is None

    @pytest.mark.asyncio
    async def test_get_metric_not_found(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        assert await repo.get_metric("missing") is None

    @pytest.mark.asyncio
    async def test_set_metric_creates_new(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        result = await repo.set_metric("new_key", "100")
        repo._client.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_set_metric_updates_existing(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"metric_key": "existing", "metric_value": "50", "period": "all"},
        ])
        await repo.set_metric("existing", "100")
        repo._client.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_all_metrics(self, repo):
        repo._client.read_all = AsyncMock(return_value=[
            {"metric_key": "a", "metric_value": "1", "period": "all"},
            {"metric_key": "b", "metric_value": "2", "period": "monthly"},
            {"metric_key": "c", "metric_value": "3", "period": "all"},
        ])
        result = await repo.get_all_metrics("all")
        assert result == {"a": "1", "c": "3"}

    @pytest.mark.asyncio
    async def test_refresh_dashboard(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        await repo.refresh_dashboard({"k1": "v1", "k2": "v2"})
        assert repo._client.create.await_count == 2


# ---------------------------------------------------------------------------
# QuestResultRepository
# ---------------------------------------------------------------------------

class TestQuestResultRepository:
    @pytest.fixture
    def repo(self):
        r = QuestResultRepository()
        r._client = _mock_gas_client()
        return r

    def test_init(self):
        r = QuestResultRepository()
        assert r.worksheet_name == "quest_results"

    @pytest.mark.asyncio
    async def test_submit_result(self, repo):
        result = await repo.submit_result("room-1", "user-1", 3, "My submission", "competition", 120)
        assert result["room_id"] == "room-1"
        assert result["quest_id"] == 3
        assert result["mode_used"] == "competition"
        repo._client.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_scores(self, repo):
        await repo.update_scores("result-1", {"human_score": 85, "ai_score": 78})
        repo._client.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_scores_with_version(self, repo):
        await repo.update_scores("result-1", {"human_score": 85}, version=2)
        repo._client.update.assert_awaited_once_with(
            "quest_results", "result-1", {"human_score": 85}, version=2
        )

    @pytest.mark.asyncio
    async def test_get_room_results(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "r1", "room_id": "room-1"},
        ])
        results = await repo.get_room_results("room-1")
        assert len(results) == 1

    @pytest.mark.asyncio
    async def test_get_user_results(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "r1", "user_id": "user-1"},
            {"id": "r2", "user_id": "user-1"},
        ])
        results = await repo.get_user_results("user-1")
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_get_quest_results_filters_by_quest_id(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "r1", "room_id": "room-1", "quest_id": "3"},
            {"id": "r2", "room_id": "room-1", "quest_id": "5"},
        ])
        results = await repo.get_quest_results("room-1", 3)
        assert len(results) == 1
        assert results[0]["quest_id"] == "3"


# ---------------------------------------------------------------------------
# RoomRepository
# ---------------------------------------------------------------------------

class TestGenerateInviteCode:
    def test_length(self):
        code = generate_invite_code(8)
        assert len(code) == 8

    def test_default_length(self):
        code = generate_invite_code()
        assert len(code) == 6

    def test_uppercase_and_digits(self):
        code = generate_invite_code(100)
        assert code == code.upper()
        assert all(c.isalnum() for c in code)


class TestRoomRepository:
    @pytest.fixture
    def repo(self):
        r = RoomRepository()
        r._client = _mock_gas_client()
        return r

    def test_init(self):
        r = RoomRepository()
        assert r.worksheet_name == "rooms"

    @pytest.mark.asyncio
    async def test_create_room(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])  # unique code
        result = await repo.create_room("Test Room", quest_id=1, created_by="user-1")
        assert result["name"] == "Test Room"
        assert result["status"] == "waiting"
        assert len(result["invite_code"]) == 6

    @pytest.mark.asyncio
    async def test_find_by_invite_code(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "room-1", "invite_code": "ABC123"},
        ])
        result = await repo.find_by_invite_code("ABC123")
        assert result["id"] == "room-1"

    @pytest.mark.asyncio
    async def test_find_active_rooms(self, repo):
        repo._client.read_all = AsyncMock(return_value=[
            {"id": "r1", "status": "waiting"},
            {"id": "r2", "status": "active"},
            {"id": "r3", "status": "completed"},
        ])
        result = await repo.find_active_rooms()
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_update_status(self, repo):
        await repo.update_status("room-1", "active")
        repo._client.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_increment_count(self, repo):
        repo._client.read_by_id = AsyncMock(return_value={"id": "r1", "current_count": "5"})
        await repo.increment_count("r1")
        repo._client.update.assert_awaited_once_with("rooms", "r1", {"current_count": 6})

    @pytest.mark.asyncio
    async def test_increment_count_not_found(self, repo):
        repo._client.read_by_id = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="not found"):
            await repo.increment_count("missing")

    @pytest.mark.asyncio
    async def test_decrement_count(self, repo):
        repo._client.read_by_id = AsyncMock(return_value={"id": "r1", "current_count": "3"})
        await repo.decrement_count("r1")
        repo._client.update.assert_awaited_once_with("rooms", "r1", {"current_count": 2})

    @pytest.mark.asyncio
    async def test_decrement_count_at_zero(self, repo):
        repo._client.read_by_id = AsyncMock(return_value={"id": "r1", "current_count": "0"})
        await repo.decrement_count("r1")
        repo._client.update.assert_awaited_once_with("rooms", "r1", {"current_count": 0})

    @pytest.mark.asyncio
    async def test_generate_unique_code_collision(self, repo):
        """First 2 codes collide, third is unique."""
        call_count = 0

        async def mock_find(ws, field, value):
            nonlocal call_count
            call_count += 1
            if call_count <= 2:
                return [{"invite_code": value}]
            return []

        repo._client.read_by_field = mock_find
        code = await repo._generate_unique_code()
        assert len(code) == 6
        assert call_count == 3

    @pytest.mark.asyncio
    async def test_generate_unique_code_all_collisions(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[{"invite_code": "X"}])
        with pytest.raises(RuntimeError, match="10 attempts"):
            await repo._generate_unique_code()


# ---------------------------------------------------------------------------
# RoomParticipantRepository
# ---------------------------------------------------------------------------

class TestRoomParticipantRepository:
    @pytest.fixture
    def repo(self):
        r = RoomParticipantRepository()
        r._client = _mock_gas_client()
        return r

    @pytest.mark.asyncio
    async def test_join_room(self, repo):
        result = await repo.join_room("room-1", "user-1", "user@test.com", "Team A")
        assert result["status"] == "active"
        assert result["team_name"] == "Team A"

    @pytest.mark.asyncio
    async def test_leave_room(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"room_id": "room-1", "user_id": "user-1", "status": "active"},
        ])
        await repo.leave_room("room-1", "user-1")
        repo._client.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_leave_room_not_found(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        with pytest.raises(ValueError, match="not in room"):
            await repo.leave_room("room-1", "missing-user")

    @pytest.mark.asyncio
    async def test_get_room_participants(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"user_id": "u1", "status": "active"},
            {"user_id": "u2", "status": "left"},
            {"user_id": "u3", "status": "active"},
        ])
        result = await repo.get_room_participants("room-1")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_is_in_room_true(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"user_id": "user-1", "status": "active"},
        ])
        assert await repo.is_in_room("room-1", "user-1") is True

    @pytest.mark.asyncio
    async def test_is_in_room_false(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        assert await repo.is_in_room("room-1", "user-1") is False


# ---------------------------------------------------------------------------
# UserRepository
# ---------------------------------------------------------------------------

class TestUserRepository:
    @pytest.fixture
    def repo(self):
        r = UserRepository()
        r._client = _mock_gas_client()
        return r

    def test_init(self):
        r = UserRepository()
        assert r.worksheet_name == "users"

    @pytest.mark.asyncio
    async def test_find_by_email(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "u1", "email": "test@test.com"},
        ])
        result = await repo.find_by_email("test@test.com")
        assert result["id"] == "u1"

    @pytest.mark.asyncio
    async def test_find_by_email_not_found(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        assert await repo.find_by_email("nope@test.com") is None

    @pytest.mark.asyncio
    async def test_create_user(self, repo):
        result = await repo.create_user("new@test.com", "New User", role="learner")
        assert result["email"] == "new@test.com"
        assert result["display_name"] == "New User"
        assert result["is_active"] == "TRUE"
        assert result["total_points"] == 0

    @pytest.mark.asyncio
    async def test_get_or_create_existing(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "u1", "email": "existing@test.com"},
        ])
        result = await repo.get_or_create("existing@test.com", "Name")
        assert result["id"] == "u1"
        repo._client.create.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_get_or_create_new(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[])
        result = await repo.get_or_create("new@test.com", "New Name")
        assert result["email"] == "new@test.com"
        repo._client.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_last_active(self, repo):
        await repo.update_last_active("user-1")
        repo._client.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_add_points(self, repo):
        repo._client.read_by_id = AsyncMock(return_value={"id": "u1", "total_points": "100"})
        await repo.add_points("u1", 50)
        repo._client.update.assert_awaited_once()
        call_args = repo._client.update.call_args
        assert call_args[0][2]["total_points"] == 150

    @pytest.mark.asyncio
    async def test_add_points_user_not_found(self, repo):
        repo._client.read_by_id = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="not found"):
            await repo.add_points("missing", 50)

    @pytest.mark.asyncio
    async def test_list_active_users(self, repo):
        repo._client.read_all = AsyncMock(return_value=[
            {"id": "u1", "is_active": "TRUE"},
            {"id": "u2", "is_active": "FALSE"},
        ])
        result = await repo.list_active_users()
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_leaderboard(self, repo):
        repo._client.read_all = AsyncMock(return_value=[
            {"id": "u1", "total_points": "300", "is_active": "TRUE"},
            {"id": "u2", "total_points": "100", "is_active": "TRUE"},
            {"id": "u3", "total_points": "200", "is_active": "TRUE"},
        ])
        result = await repo.get_leaderboard(limit=2)
        assert len(result) == 2
        assert result[0]["total_points"] == "300"
        assert result[1]["total_points"] == "200"


# ---------------------------------------------------------------------------
# ActivityLogRepository
# ---------------------------------------------------------------------------

class TestActivityLogRepository:
    @pytest.fixture
    def repo(self):
        r = ActivityLogRepository()
        r._client = _mock_gas_client()
        return r

    def test_init(self):
        r = ActivityLogRepository()
        assert r.worksheet_name == "activity_logs"

    def test_actions_set(self):
        assert "login" in ActivityLogRepository.ACTIONS
        assert "quest_submit" in ActivityLogRepository.ACTIONS

    @pytest.mark.asyncio
    async def test_log_activity(self, repo):
        result = await repo.log_activity(
            "user-1", "login", target_type="session", ip_address="127.0.0.1"
        )
        assert result["user_id"] == "user-1"
        assert result["action"] == "login"
        assert result["ip_address"] == "127.0.0.1"
        repo._client.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_user_logs(self, repo):
        repo._client.read_by_field = AsyncMock(return_value=[
            {"id": "l1", "user_id": "user-1", "action": "login"},
            {"id": "l2", "user_id": "user-1", "action": "quest_submit"},
        ])
        result = await repo.get_user_logs("user-1")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_get_recent_logs(self, repo):
        repo._client.read_all = AsyncMock(return_value=[
            {"id": "l1", "created_at": "2026-01-01T00:00:00"},
            {"id": "l2", "created_at": "2026-03-01T00:00:00"},
            {"id": "l3", "created_at": "2026-02-01T00:00:00"},
        ])
        result = await repo.get_recent_logs(limit=2)
        assert len(result) == 2
        assert result[0]["id"] == "l2"  # most recent first

    @pytest.mark.asyncio
    async def test_get_recent_logs_empty(self, repo):
        repo._client.read_all = AsyncMock(return_value=[])
        result = await repo.get_recent_logs()
        assert result == []
