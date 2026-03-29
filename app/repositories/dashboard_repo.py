from __future__ import annotations

from typing import Any

from app.repositories.base import SheetsRepository


class DashboardRepository(SheetsRepository):
    """Repository for dashboard_stats worksheet - aggregated metrics cache."""

    HEADERS = ["metric_key", "metric_value", "period", "updated_at", "_version"]

    def __init__(self) -> None:
        super().__init__(worksheet_name="dashboard_stats", id_field="metric_key")

    async def get_metric(self, key: str, period: str = "all") -> str | None:
        metrics = await self.find_by_field("metric_key", key)
        for m in metrics:
            if m.get("period") == period:
                return m.get("metric_value")
        return None

    async def set_metric(self, key: str, value: str, period: str = "all") -> dict[str, Any]:
        metrics = await self.find_by_field("metric_key", key)
        existing = next((m for m in metrics if m.get("period") == period), None)

        if existing:
            return await self.update(
                key, {"metric_value": value, "updated_at": self.now_iso()}
            )
        return await self.create({
            "metric_key": key,
            "metric_value": value,
            "period": period,
            "updated_at": self.now_iso(),
        })

    async def get_all_metrics(self, period: str = "all") -> dict[str, str]:
        all_metrics = await self.find_all()
        return {
            m["metric_key"]: m.get("metric_value", "")
            for m in all_metrics
            if m.get("period") == period
        }

    async def refresh_dashboard(self, stats: dict[str, str], period: str = "all") -> None:
        for key, value in stats.items():
            await self.set_metric(key, value, period)


dashboard_repo = DashboardRepository()
