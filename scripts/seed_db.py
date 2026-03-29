"""Seed the PostgreSQL database with initial tenant and admin user.

Run after alembic migration to create the default tenant and super admin.
Requires DATABASE_URL to be configured (via .env or environment).

Usage:
    python scripts/seed_db.py
"""

import asyncio
import sys
import uuid
from datetime import UTC, datetime

sys.path.insert(0, ".")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.gamification import Badge, BadgeConditionType

DEFAULT_TENANT = {
    "name": "Beyond AI 체험판",
    "slug": "beyond-ai-trial",
    "description": "Beyond AI 프로그램 체험 및 데모용 테넌트",
}

DEFAULT_ADMIN = {
    "email": "admin@beyond-ai.kr",
    "display_name": "관리자",
    "password": "change-me-on-first-login!",
    "role": UserRole.SUPER_ADMIN,
}

DEFAULT_BADGES = [
    {
        "name": "첫 번째 대결",
        "description": "AI와의 첫 번째 퀘스트를 완료했습니다",
        "condition_type": BadgeConditionType.LESSONS_COMPLETED,
        "condition_value": 1,
    },
    {
        "name": "연승 3일",
        "description": "3일 연속으로 퀘스트에 참여했습니다",
        "condition_type": BadgeConditionType.STREAK_DAYS,
        "condition_value": 3,
    },
    {
        "name": "100점 돌파",
        "description": "누적 점수 100점을 달성했습니다",
        "condition_type": BadgeConditionType.TOTAL_POINTS,
        "condition_value": 100,
    },
    {
        "name": "퀘스트 마스터",
        "description": "3개 퀘스트를 완료했습니다",
        "condition_type": BadgeConditionType.COURSES_COMPLETED,
        "condition_value": 3,
    },
    {
        "name": "AI 헌터",
        "description": "6개 퀘스트를 완료했습니다",
        "condition_type": BadgeConditionType.COURSES_COMPLETED,
        "condition_value": 6,
    },
    {
        "name": "전설의 도전자",
        "description": "12개 퀘스트를 모두 완료했습니다",
        "condition_type": BadgeConditionType.COURSES_COMPLETED,
        "condition_value": 12,
    },
    {
        "name": "연승 30일",
        "description": "30일 연속 퀘스트에 참여했습니다",
        "condition_type": BadgeConditionType.STREAK_DAYS,
        "condition_value": 30,
    },
    {
        "name": "1000점 클럽",
        "description": "누적 점수 1,000점을 달성했습니다",
        "condition_type": BadgeConditionType.TOTAL_POINTS,
        "condition_value": 1000,
    },
]


async def seed() -> None:
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # --- Tenant ---
        result = await session.execute(
            select(Tenant).where(Tenant.slug == DEFAULT_TENANT["slug"])
        )
        tenant = result.scalar_one_or_none()

        if tenant is None:
            tenant = Tenant(
                id=uuid.uuid4(),
                name=DEFAULT_TENANT["name"],
                slug=DEFAULT_TENANT["slug"],
                description=DEFAULT_TENANT["description"],
            )
            session.add(tenant)
            await session.flush()
            print(f"  [OK] Tenant created: {tenant.name} (slug={tenant.slug})")
        else:
            print(f"  [SKIP] Tenant already exists: {tenant.slug}")

        # --- Admin user ---
        result = await session.execute(
            select(User).where(
                User.tenant_id == tenant.id,
                User.email == DEFAULT_ADMIN["email"],
            )
        )
        admin = result.scalar_one_or_none()

        if admin is None:
            admin = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                email=DEFAULT_ADMIN["email"],
                display_name=DEFAULT_ADMIN["display_name"],
                hashed_password=hash_password(DEFAULT_ADMIN["password"]),
                role=DEFAULT_ADMIN["role"],
            )
            session.add(admin)
            await session.flush()
            print(f"  [OK] Admin created: {admin.email} (role={admin.role.value})")
        else:
            print(f"  [SKIP] Admin already exists: {admin.email}")

        # --- Badges ---
        result = await session.execute(select(Badge))
        existing_badges = {b.name for b in result.scalars().all()}
        created_count = 0

        for badge_data in DEFAULT_BADGES:
            if badge_data["name"] not in existing_badges:
                badge = Badge(
                    id=uuid.uuid4(),
                    name=badge_data["name"],
                    description=badge_data["description"],
                    condition_type=badge_data["condition_type"],
                    condition_value=badge_data["condition_value"],
                )
                session.add(badge)
                created_count += 1

        if created_count > 0:
            await session.flush()
            print(f"  [OK] Badges created: {created_count} new badges")
        else:
            print(f"  [SKIP] All {len(DEFAULT_BADGES)} badges already exist")

        await session.commit()

    await engine.dispose()


async def main() -> None:
    print("Seeding Beyond AI database...")
    print()
    await seed()
    print()
    print("Done. Default admin credentials:")
    print(f"  Email: {DEFAULT_ADMIN['email']}")
    print(f"  Password: {DEFAULT_ADMIN['password']}")
    print()
    print("IMPORTANT: Change the admin password after first login!")


if __name__ == "__main__":
    asyncio.run(main())
