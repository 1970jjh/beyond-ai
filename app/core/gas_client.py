from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class GASClientError(Exception):
    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.status_code = status_code


class GASClient:
    """HTTP client for Google Apps Script web API.

    GAS is deployed as a web app (doGet/doPost) and handles all
    Google Sheets read/write operations under the script owner's permissions.
    This eliminates the need for user-level OAuth scopes for Sheets.
    """

    def __init__(self, base_url: str | None = None, api_key: str | None = None) -> None:
        self._base_url = (base_url or settings.gas_web_url).rstrip("/")
        self._api_key = api_key or settings.gas_api_key
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0),
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def request(
        self,
        action: str,
        sheet: str,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Send a request to GAS web API.

        Args:
            action: Operation type (read_all, read_by_id, create, update, delete, batch_create, batch_update)
            sheet: Target worksheet name
            data: Request body data
            params: Additional query parameters
        """
        client = await self._get_client()

        payload = {
            "action": action,
            "sheet": sheet,
            "apiKey": self._api_key,
            **(data or {}),
        }

        try:
            response = await client.post(
                self._base_url,
                json=payload,
                params=params,
            )
        except httpx.TimeoutException as e:
            raise GASClientError(f"GAS request timeout: {action}/{sheet}") from e
        except httpx.RequestError as e:
            raise GASClientError(f"GAS request failed: {e}") from e

        if response.status_code != 200:
            raise GASClientError(
                f"GAS returned {response.status_code}: {response.text}",
                status_code=response.status_code,
            )

        result = response.json()

        if not result.get("success", False):
            error_msg = result.get("error", "Unknown GAS error")
            raise GASClientError(error_msg, status_code=400)

        return result

    async def read_all(self, sheet: str) -> list[dict[str, Any]]:
        result = await self.request("read_all", sheet)
        return result.get("data", [])

    async def read_by_id(self, sheet: str, row_id: str) -> dict[str, Any] | None:
        result = await self.request("read_by_id", sheet, data={"id": row_id})
        return result.get("data")

    async def read_by_field(
        self, sheet: str, field: str, value: str
    ) -> list[dict[str, Any]]:
        result = await self.request(
            "read_by_field", sheet, data={"field": field, "value": value}
        )
        return result.get("data", [])

    async def create(self, sheet: str, row: dict[str, Any]) -> dict[str, Any]:
        result = await self.request("create", sheet, data={"row": row})
        return result.get("data", row)

    async def update(
        self, sheet: str, row_id: str, updates: dict[str, Any], version: int | None = None
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"id": row_id, "updates": updates}
        if version is not None:
            payload["version"] = version
        result = await self.request("update", sheet, data=payload)
        return result.get("data", updates)

    async def delete(self, sheet: str, row_id: str) -> None:
        await self.request("delete", sheet, data={"id": row_id})

    async def batch_create(self, sheet: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        result = await self.request("batch_create", sheet, data={"rows": rows})
        return result.get("data", rows)

    async def batch_update(
        self, sheet: str, updates: list[dict[str, Any]]
    ) -> None:
        await self.request("batch_update", sheet, data={"updates": updates})

    async def init_sheet(
        self, sheet: str, headers: list[str], initial_data: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        result = await self.request(
            "init_sheet",
            sheet,
            data={"headers": headers, "initialData": initial_data or []},
        )
        return result.get("data", {})


gas_client = GASClient()
