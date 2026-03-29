"""Initialize Google Sheets via GAS web API.

Run this script once to create all worksheets with headers and initial admin data.
Requires BEYOND_GAS_WEB_URL and BEYOND_GAS_API_KEY environment variables.

Usage:
    python scripts/init_sheets.py
"""

import asyncio
import sys

sys.path.insert(0, ".")

from app.core.gas_client import gas_client
from app.repositories.auth_repo import AuthRepository
from app.repositories.dashboard_repo import DashboardRepository
from app.repositories.log_repo import ActivityLogRepository
from app.repositories.quest_repo import QuestResultRepository
from app.repositories.room_repo import RoomParticipantRepository, RoomRepository
from app.repositories.user_repo import UserRepository

INITIAL_ADMINS = [
    {
        "email": "jjh@jjcreative.co.kr",
        "role": "super_admin",
        "name": "정재현",
        "added_by": "system",
        "is_active": "TRUE",
        "_version": 1,
    },
    {
        "email": "jjhgather@gmail.com",
        "role": "super_admin",
        "name": "정재현",
        "added_by": "system",
        "is_active": "TRUE",
        "_version": 1,
    },
]

SHEETS = [
    ("auth_admins", AuthRepository.HEADERS, INITIAL_ADMINS),
    ("users", UserRepository.HEADERS, []),
    ("rooms", RoomRepository.HEADERS, []),
    ("room_participants", RoomParticipantRepository.HEADERS, []),
    ("quest_results", QuestResultRepository.HEADERS, []),
    ("activity_logs", ActivityLogRepository.HEADERS, []),
    ("dashboard_stats", DashboardRepository.HEADERS, []),
]


async def main() -> None:
    print("Initializing Beyond AI Google Sheets...")
    print()

    for sheet_name, headers, initial_data in SHEETS:
        try:
            # Add timestamps to initial data
            for row in initial_data:
                if "added_at" in headers and "added_at" not in row:
                    from datetime import UTC, datetime
                    row["added_at"] = datetime.now(UTC).isoformat()

            result = await gas_client.init_sheet(sheet_name, headers, initial_data)
            status = result.get("status", "unknown")
            rows = result.get("rows", 0)
            print(f"  [OK] {sheet_name}: {status} ({rows} initial rows)")
        except Exception as e:
            print(f"  [FAIL] {sheet_name}: {e}")

    await gas_client.close()
    print()
    print("Done. Verify sheets at Google Drive '비욘드 AI' folder.")


if __name__ == "__main__":
    asyncio.run(main())
