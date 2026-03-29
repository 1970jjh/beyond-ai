"""Tests for app.repositories.base - SheetsRepository with mocked GAS client"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.repositories.base import OptimisticLockError, SheetsRepository
from app.core.gas_client import GASClientError


def make_repo(worksheet: str = "test_sheet") -> tuple[SheetsRepository, MagicMock]:
    """Return (repo, mock_client). Cache is cleared before each repo creation."""
    from app.core.cache import cache
    cache.invalidate_all()

    mock_client = MagicMock()
    mock_client.read_all = AsyncMock(return_value=[])
    mock_client.read_by_id = AsyncMock(return_value=None)
    mock_client.read_by_field = AsyncMock(return_value=[])
    mock_client.create = AsyncMock(side_effect=lambda sheet, row: row)
    mock_client.update = AsyncMock(side_effect=lambda sheet, rid, data, **kw: data)
    mock_client.delete = AsyncMock(return_value=None)
    mock_client.batch_create = AsyncMock(side_effect=lambda sheet, rows: rows)
    mock_client.batch_update = AsyncMock(return_value=None)
    repo = SheetsRepository(worksheet_name=worksheet, client=mock_client)
    return repo, mock_client


class TestFindAll:
    @pytest.mark.asyncio
    async def test_returns_all_rows(self):
        repo, client = make_repo()
        client.read_all.return_value = [{"id": "1"}, {"id": "2"}]
        result = await repo.find_all()
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_applies_filters(self):
        repo, client = make_repo()
        client.read_all.return_value = [
            {"id": "1", "status": "active"},
            {"id": "2", "status": "inactive"},
        ]
        result = await repo.find_all(filters={"status": "active"})
        assert len(result) == 1
        assert result[0]["id"] == "1"

    @pytest.mark.asyncio
    async def test_caches_result(self):
        repo, client = make_repo()
        client.read_all.return_value = [{"id": "1"}]
        await repo.find_all()
        await repo.find_all()
        # Second call should use cache — GAS client called only once
        client.read_all.assert_called_once()


class TestFindById:
    @pytest.mark.asyncio
    async def test_returns_row_when_found(self):
        repo, client = make_repo()
        client.read_by_id.return_value = {"id": "abc", "name": "test"}
        result = await repo.find_by_id("abc")
        assert result == {"id": "abc", "name": "test"}

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        repo, client = make_repo()
        client.read_by_id.return_value = None
        result = await repo.find_by_id("missing")
        assert result is None

    @pytest.mark.asyncio
    async def test_caches_result(self):
        repo, client = make_repo()
        client.read_by_id.return_value = {"id": "x"}
        await repo.find_by_id("x")
        await repo.find_by_id("x")
        client.read_by_id.assert_called_once()


class TestCreate:
    @pytest.mark.asyncio
    async def test_adds_version_field(self):
        repo, client = make_repo()
        await repo.create({"name": "Alice"})
        call_args = client.create.call_args[0]
        row_data = call_args[1]
        assert row_data.get("_version") == 1

    @pytest.mark.asyncio
    async def test_generates_id_if_missing(self):
        repo, client = make_repo()
        await repo.create({"name": "Bob"})
        row_data = client.create.call_args[0][1]
        assert "id" in row_data
        assert len(row_data["id"]) == 36  # UUID format

    @pytest.mark.asyncio
    async def test_uses_provided_id(self):
        repo, client = make_repo()
        await repo.create({"id": "custom-id", "name": "Carol"})
        row_data = client.create.call_args[0][1]
        assert row_data["id"] == "custom-id"

    @pytest.mark.asyncio
    async def test_invalidates_cache_after_create(self):
        repo, client = make_repo("users")
        from app.core.cache import cache
        # Prime cache with a value
        cache.set("users:all", [{"id": "1"}], ttl=60)
        assert cache.get("users:all") is not None
        # Create should invalidate the cache
        await repo.create({"name": "test"})
        assert cache.get("users:all") is None


class TestUpdate:
    @pytest.mark.asyncio
    async def test_updates_without_version(self):
        repo, client = make_repo()
        await repo.update("row-1", {"name": "updated"})
        client.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_passes_version_when_provided(self):
        repo, client = make_repo()
        await repo.update("row-1", {"name": "updated"}, expected_version=2)
        _, kwargs = client.update.call_args
        assert kwargs.get("version") == 2 or client.update.call_args[1].get("version") == 2

    @pytest.mark.asyncio
    async def test_raises_optimistic_lock_error_on_version_conflict(self):
        repo, client = make_repo()
        client.update.side_effect = GASClientError("version_conflict detected")
        with pytest.raises(OptimisticLockError):
            await repo.update("row-1", {"name": "x"}, expected_version=1)


class TestDelete:
    @pytest.mark.asyncio
    async def test_calls_gas_delete(self):
        repo, client = make_repo()
        await repo.delete("row-to-delete")
        client.delete.assert_called_once_with("test_sheet", "row-to-delete")

    @pytest.mark.asyncio
    async def test_soft_delete_sets_inactive(self):
        repo, client = make_repo()
        await repo.soft_delete("row-1")
        client.update.assert_called_once()
        update_data = client.update.call_args[0][2]
        assert update_data.get("is_active") is False


class TestBatchOperations:
    @pytest.mark.asyncio
    async def test_batch_create_adds_version(self):
        repo, client = make_repo()
        await repo.batch_create([{"name": "A"}, {"name": "B"}])
        rows = client.batch_create.call_args[0][1]
        assert all(r.get("_version") == 1 for r in rows)

    @pytest.mark.asyncio
    async def test_batch_create_generates_ids(self):
        repo, client = make_repo()
        await repo.batch_create([{"name": "A"}, {"name": "B"}])
        rows = client.batch_create.call_args[0][1]
        ids = [r["id"] for r in rows]
        assert len(set(ids)) == 2  # unique IDs


class TestHelpers:
    def test_now_iso_is_valid_iso_format(self):
        from datetime import datetime
        result = SheetsRepository.now_iso()
        # Should parse as ISO datetime
        dt = datetime.fromisoformat(result)
        assert dt is not None

    def test_new_id_is_uuid(self):
        import uuid
        result = SheetsRepository.new_id()
        parsed = uuid.UUID(result)
        assert str(parsed) == result

    def test_cache_key_without_suffix(self):
        repo, _ = make_repo("my_sheet")
        assert repo._cache_key() == "my_sheet"

    def test_cache_key_with_suffix(self):
        repo, _ = make_repo("my_sheet")
        assert repo._cache_key("all") == "my_sheet:all"
