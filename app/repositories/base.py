from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.cache import cache
from app.core.gas_client import GASClient, GASClientError, gas_client


class OptimisticLockError(Exception):
    """Raised when a concurrent write conflict is detected via version mismatch."""


class SheetsRepository:
    """Base repository for Google Sheets data access via GAS web API.

    Treats each worksheet as a table with row 1 as headers.
    Supports optimistic locking via a _version column.
    """

    def __init__(
        self,
        worksheet_name: str,
        id_field: str = "id",
        client: GASClient | None = None,
    ) -> None:
        self.worksheet_name = worksheet_name
        self.id_field = id_field
        self._client = client or gas_client

    def _cache_key(self, suffix: str = "") -> str:
        if suffix:
            return f"{self.worksheet_name}:{suffix}"
        return self.worksheet_name

    async def find_all(self, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        cache_key = self._cache_key("all")
        cached = cache.get(cache_key)
        if cached is not None:
            rows = cached
        else:
            rows = await self._client.read_all(self.worksheet_name)
            cache.set(cache_key, rows)

        if filters:
            rows = [
                r for r in rows
                if all(r.get(k) == v for k, v in filters.items())
            ]
        return rows

    async def find_by_id(self, row_id: str) -> dict[str, Any] | None:
        cache_key = self._cache_key(f"id:{row_id}")
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        result = await self._client.read_by_id(self.worksheet_name, row_id)
        if result:
            cache.set(cache_key, result)
        return result

    async def find_by_field(self, field: str, value: str) -> list[dict[str, Any]]:
        cache_key = self._cache_key(f"field:{field}:{value}")
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        results = await self._client.read_by_field(self.worksheet_name, field, value)
        cache.set(cache_key, results)
        return results

    async def find_one_by_field(self, field: str, value: str) -> dict[str, Any] | None:
        results = await self.find_by_field(field, value)
        return results[0] if results else None

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        row = {
            self.id_field: data.get(self.id_field, str(uuid.uuid4())),
            **data,
            "_version": 1,
        }
        result = await self._client.create(self.worksheet_name, row)
        cache.invalidate(self.worksheet_name)
        return result

    async def update(
        self, row_id: str, data: dict[str, Any], expected_version: int | None = None
    ) -> dict[str, Any]:
        if expected_version is not None:
            try:
                result = await self._client.update(
                    self.worksheet_name, row_id, data, version=expected_version
                )
            except GASClientError as e:
                if "version_conflict" in str(e).lower():
                    raise OptimisticLockError(
                        f"Version conflict on {self.worksheet_name}/{row_id}: "
                        f"expected {expected_version}"
                    ) from e
                raise
        else:
            result = await self._client.update(self.worksheet_name, row_id, data)

        cache.invalidate(self.worksheet_name)
        return result

    async def delete(self, row_id: str) -> None:
        await self._client.delete(self.worksheet_name, row_id)
        cache.invalidate(self.worksheet_name)

    async def soft_delete(self, row_id: str) -> dict[str, Any]:
        return await self.update(row_id, {"is_active": False})

    async def batch_create(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        prepared = [
            {
                self.id_field: row.get(self.id_field, str(uuid.uuid4())),
                **row,
                "_version": 1,
            }
            for row in rows
        ]
        results = await self._client.batch_create(self.worksheet_name, prepared)
        cache.invalidate(self.worksheet_name)
        return results

    async def batch_update(self, updates: list[dict[str, Any]]) -> None:
        await self._client.batch_update(self.worksheet_name, updates)
        cache.invalidate(self.worksheet_name)

    async def count(self, filters: dict[str, Any] | None = None) -> int:
        rows = await self.find_all(filters)
        return len(rows)

    @staticmethod
    def now_iso() -> str:
        return datetime.now(UTC).isoformat()

    @staticmethod
    def new_id() -> str:
        return str(uuid.uuid4())
