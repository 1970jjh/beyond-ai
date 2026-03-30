"""Tests for app.core.http_client — singleton httpx client management."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.core.http_client import get_http_client, close_all_clients, _clients


@pytest.fixture(autouse=True)
def _clean_clients():
    """Ensure client cache is cleared before/after each test."""
    _clients.clear()
    yield
    _clients.clear()


class TestGetHttpClient:
    def test_creates_new_client(self):
        client = get_http_client("test-provider")
        assert client is not None
        assert "test-provider" in _clients

    def test_returns_same_client_on_second_call(self):
        c1 = get_http_client("claude")
        c2 = get_http_client("claude")
        assert c1 is c2

    def test_different_providers_get_different_clients(self):
        c1 = get_http_client("claude")
        c2 = get_http_client("gemini")
        assert c1 is not c2

    def test_custom_timeout(self):
        client = get_http_client("slow-provider", timeout=300)
        assert client.timeout.connect == 300

    def test_recreates_closed_client(self):
        c1 = get_http_client("test")
        c1._transport = MagicMock()  # prevent real close
        # Simulate a closed client
        _clients["test"] = MagicMock(is_closed=True)
        c2 = get_http_client("test")
        assert c2 is not c1


class TestCloseAllClients:
    @pytest.mark.asyncio
    async def test_closes_all_open_clients(self):
        mock1 = AsyncMock()
        mock1.is_closed = False
        mock2 = AsyncMock()
        mock2.is_closed = False
        _clients["a"] = mock1
        _clients["b"] = mock2

        await close_all_clients()

        mock1.aclose.assert_awaited_once()
        mock2.aclose.assert_awaited_once()
        assert len(_clients) == 0

    @pytest.mark.asyncio
    async def test_skips_already_closed_clients(self):
        mock_closed = AsyncMock()
        mock_closed.is_closed = True
        _clients["closed"] = mock_closed

        await close_all_clients()

        mock_closed.aclose.assert_not_awaited()
        assert len(_clients) == 0

    @pytest.mark.asyncio
    async def test_empty_clients_is_noop(self):
        await close_all_clients()
        assert len(_clients) == 0
