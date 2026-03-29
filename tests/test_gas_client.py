"""Tests for app.core.gas_client - GASClient HTTP wrapper"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from app.core.gas_client import GASClient, GASClientError


def _make_client() -> GASClient:
    return GASClient(base_url="https://script.google.com/test", api_key="test-key")


def _ok_response(data) -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = 200
    resp.json.return_value = {"success": True, "data": data}
    return resp


def _error_response(status_code: int, text: str = "error") -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = status_code
    resp.text = text
    resp.json.return_value = {"success": False, "error": text}
    return resp


def _gas_failure_response(error_msg: str) -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.status_code = 200
    resp.json.return_value = {"success": False, "error": error_msg}
    return resp


# ---------------------------------------------------------------------------
# GASClientError
# ---------------------------------------------------------------------------

class TestGASClientError:
    def test_default_status_code(self):
        err = GASClientError("something broke")
        assert err.status_code == 500

    def test_custom_status_code(self):
        err = GASClientError("not found", status_code=404)
        assert err.status_code == 404

    def test_message_preserved(self):
        err = GASClientError("test message")
        assert str(err) == "test message"


# ---------------------------------------------------------------------------
# request()
# ---------------------------------------------------------------------------

def _patched_client(response_or_exc):
    """Return a GASClient whose internal httpx client is mocked."""
    client = _make_client()
    mock_http = MagicMock(spec=httpx.AsyncClient)
    mock_http.is_closed = False
    if isinstance(response_or_exc, BaseException):
        mock_http.post = AsyncMock(side_effect=response_or_exc)
    else:
        mock_http.post = AsyncMock(return_value=response_or_exc)
    client._client = mock_http
    return client, mock_http


class TestRequest:
    @pytest.mark.asyncio
    async def test_posts_to_base_url(self):
        client, mock_http = _patched_client(_ok_response({}))

        await client.request("read_all", "users")

        mock_http.post.assert_called_once()
        call_url = mock_http.post.call_args[0][0]
        assert call_url == "https://script.google.com/test"

    @pytest.mark.asyncio
    async def test_payload_includes_action_sheet_apikey(self):
        client, mock_http = _patched_client(_ok_response({}))

        await client.request("read_by_id", "quests", data={"id": "123"})

        payload = mock_http.post.call_args[1]["json"]
        assert payload["action"] == "read_by_id"
        assert payload["sheet"] == "quests"
        assert payload["apiKey"] == "test-key"
        assert payload["id"] == "123"

    @pytest.mark.asyncio
    async def test_http_error_raises_gas_client_error(self):
        client, _ = _patched_client(_error_response(503))

        with pytest.raises(GASClientError) as exc_info:
            await client.request("read_all", "users")
        assert "503" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_gas_failure_response_raises_gas_client_error(self):
        client, _ = _patched_client(_gas_failure_response("version_conflict"))

        with pytest.raises(GASClientError) as exc_info:
            await client.request("update", "quests")
        assert "version_conflict" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_timeout_raises_gas_client_error(self):
        client, _ = _patched_client(httpx.TimeoutException("timeout"))

        with pytest.raises(GASClientError) as exc_info:
            await client.request("read_all", "users")
        assert "timeout" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_request_error_raises_gas_client_error(self):
        client, _ = _patched_client(httpx.RequestError("connection refused"))

        with pytest.raises(GASClientError):
            await client.request("read_all", "users")


# ---------------------------------------------------------------------------
# read_all / read_by_id / read_by_field
# ---------------------------------------------------------------------------

class TestReadMethods:
    @pytest.mark.asyncio
    async def test_read_all_returns_list(self):
        client = _make_client()
        rows = [{"id": "1"}, {"id": "2"}]
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True, "data": rows})):
            result = await client.read_all("users")
        assert result == rows

    @pytest.mark.asyncio
    async def test_read_all_returns_empty_list_when_no_data_key(self):
        client = _make_client()
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True})):
            result = await client.read_all("users")
        assert result == []

    @pytest.mark.asyncio
    async def test_read_by_id_returns_row(self):
        client = _make_client()
        row = {"id": "abc", "name": "test"}
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True, "data": row})):
            result = await client.read_by_id("users", "abc")
        assert result == row

    @pytest.mark.asyncio
    async def test_read_by_id_returns_none_when_no_data(self):
        client = _make_client()
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True})):
            result = await client.read_by_id("users", "missing")
        assert result is None

    @pytest.mark.asyncio
    async def test_read_by_field_returns_list(self):
        client = _make_client()
        rows = [{"id": "1", "status": "active"}]
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True, "data": rows})):
            result = await client.read_by_field("users", "status", "active")
        assert result == rows


# ---------------------------------------------------------------------------
# create / update / delete
# ---------------------------------------------------------------------------

class TestWriteMethods:
    @pytest.mark.asyncio
    async def test_create_returns_created_row(self):
        client = _make_client()
        row = {"id": "new-id", "name": "Alice"}
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True, "data": row})):
            result = await client.create("users", {"name": "Alice"})
        assert result["id"] == "new-id"

    @pytest.mark.asyncio
    async def test_create_falls_back_to_input_row_when_no_data(self):
        client = _make_client()
        input_row = {"name": "Bob"}
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True})):
            result = await client.create("users", input_row)
        assert result == input_row

    @pytest.mark.asyncio
    async def test_update_sends_version_when_provided(self):
        client = _make_client()
        captured = {}

        async def mock_request(action, sheet, data=None, params=None):
            captured["data"] = data
            return {"success": True, "data": {}}

        with patch.object(client, "request", new=mock_request):
            await client.update("quests", "row-1", {"score": 90}, version=3)

        assert captured["data"]["version"] == 3

    @pytest.mark.asyncio
    async def test_update_omits_version_when_not_provided(self):
        client = _make_client()
        captured = {}

        async def mock_request(action, sheet, data=None, params=None):
            captured["data"] = data
            return {"success": True, "data": {}}

        with patch.object(client, "request", new=mock_request):
            await client.update("quests", "row-1", {"score": 90})

        assert "version" not in captured["data"]

    @pytest.mark.asyncio
    async def test_delete_calls_request_with_correct_action(self):
        client = _make_client()
        captured = {}

        async def mock_request(action, sheet, data=None, params=None):
            captured["action"] = action
            captured["data"] = data
            return {"success": True}

        with patch.object(client, "request", new=mock_request):
            await client.delete("users", "row-999")

        assert captured["action"] == "delete"
        assert captured["data"]["id"] == "row-999"


# ---------------------------------------------------------------------------
# batch operations
# ---------------------------------------------------------------------------

class TestBatchOperations:
    @pytest.mark.asyncio
    async def test_batch_create_returns_rows(self):
        client = _make_client()
        rows = [{"id": "1"}, {"id": "2"}]
        with patch.object(client, "request", new=AsyncMock(return_value={"success": True, "data": rows})):
            result = await client.batch_create("users", [{"name": "A"}, {"name": "B"}])
        assert result == rows

    @pytest.mark.asyncio
    async def test_batch_update_calls_correct_action(self):
        client = _make_client()
        captured = {}

        async def mock_request(action, sheet, data=None, params=None):
            captured["action"] = action
            return {"success": True}

        with patch.object(client, "request", new=mock_request):
            await client.batch_update("users", [{"id": "1", "score": 80}])

        assert captured["action"] == "batch_update"


# ---------------------------------------------------------------------------
# lifecycle
# ---------------------------------------------------------------------------

class TestLifecycle:
    @pytest.mark.asyncio
    async def test_close_sets_client_to_none(self):
        client = _make_client()
        mock_http = AsyncMock(spec=httpx.AsyncClient)
        mock_http.is_closed = False
        mock_http.aclose = AsyncMock()
        client._client = mock_http

        await client.close()

        mock_http.aclose.assert_called_once()
        assert client._client is None

    @pytest.mark.asyncio
    async def test_close_is_noop_when_no_client(self):
        client = _make_client()
        # Should not raise
        await client.close()
