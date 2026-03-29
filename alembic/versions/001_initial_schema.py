"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-30 00:00:00.000000

"""
from __future__ import annotations

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------------------------------------------------------------------------
    # Enum types (PostgreSQL)
    # ---------------------------------------------------------------------------
    op.execute("CREATE TYPE userrole AS ENUM ('learner', 'admin', 'super_admin')")
    op.execute("CREATE TYPE enrollmentstatus AS ENUM ('active', 'completed', 'dropped')")
    op.execute(
        "CREATE TYPE badgeconditiontype AS ENUM "
        "('total_points', 'courses_completed', 'lessons_completed', 'streak_days')"
    )
    op.execute(
        "CREATE TYPE battlestatus AS ENUM "
        "('pending', 'in_progress', 'submitted', 'scoring', 'completed')"
    )
    op.execute(
        "CREATE TYPE battleresult AS ENUM "
        "('human_win', 'ai_win', 'draw', 'in_progress')"
    )
    op.execute(
        "CREATE TYPE battlemode AS ENUM "
        "('competition', 'coach', 'partner', 'reviewer')"
    )
    op.execute(
        "CREATE TYPE questtype AS ENUM "
        "('analytical', 'creative', 'communication', 'execution')"
    )

    # ---------------------------------------------------------------------------
    # tenants
    # ---------------------------------------------------------------------------
    op.create_table(
        "tenants",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # users
    # ---------------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.Uuid(),
            sa.ForeignKey("tenants.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("learner", "admin", "super_admin", name="userrole"),
            nullable=False,
            server_default="learner",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("tenant_id", "email", name="uq_tenant_email"),
    )

    # ---------------------------------------------------------------------------
    # courses
    # ---------------------------------------------------------------------------
    op.create_table(
        "courses",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.Uuid(),
            sa.ForeignKey("tenants.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("difficulty_level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # modules
    # ---------------------------------------------------------------------------
    op.create_table(
        "modules",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "course_id",
            sa.Uuid(),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # lessons
    # ---------------------------------------------------------------------------
    op.create_table(
        "lessons",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "module_id",
            sa.Uuid(),
            sa.ForeignKey("modules.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("lesson_type", sa.String(50), nullable=False, server_default="text"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("points_reward", sa.Integer(), nullable=False, server_default="10"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # enrollments
    # ---------------------------------------------------------------------------
    op.create_table(
        "enrollments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "course_id",
            sa.Uuid(),
            sa.ForeignKey("courses.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "status",
            sa.Enum("active", "completed", "dropped", name="enrollmentstatus"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "enrolled_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )

    # ---------------------------------------------------------------------------
    # lesson_progress
    # ---------------------------------------------------------------------------
    op.create_table(
        "lesson_progress",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "enrollment_id",
            sa.Uuid(),
            sa.ForeignKey("enrollments.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "lesson_id",
            sa.Uuid(),
            sa.ForeignKey("lessons.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("enrollment_id", "lesson_id", name="uq_enrollment_lesson"),
    )

    # ---------------------------------------------------------------------------
    # badges
    # ---------------------------------------------------------------------------
    op.create_table(
        "badges",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon_url", sa.String(500), nullable=True),
        sa.Column(
            "condition_type",
            sa.Enum(
                "total_points",
                "courses_completed",
                "lessons_completed",
                "streak_days",
                name="badgeconditiontype",
            ),
            nullable=False,
        ),
        sa.Column("condition_value", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # user_badges
    # ---------------------------------------------------------------------------
    op.create_table(
        "user_badges",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "badge_id",
            sa.Uuid(),
            sa.ForeignKey("badges.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "earned_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    # ---------------------------------------------------------------------------
    # point_transactions
    # ---------------------------------------------------------------------------
    op.create_table(
        "point_transactions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(300), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # leaderboard_entries
    # ---------------------------------------------------------------------------
    op.create_table(
        "leaderboard_entries",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("total_points", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("courses_completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lessons_completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # teams
    # ---------------------------------------------------------------------------
    op.create_table(
        "teams",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column(
            "tenant_id",
            sa.Uuid(),
            sa.ForeignKey("tenants.id"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # team_members
    # ---------------------------------------------------------------------------
    op.create_table(
        "team_members",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "team_id",
            sa.Uuid(),
            sa.ForeignKey("teams.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("role", sa.String(30), nullable=False, server_default="member"),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # ---------------------------------------------------------------------------
    # battles
    # ---------------------------------------------------------------------------
    op.create_table(
        "battles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("quest_id", sa.Integer(), nullable=False, index=True),
        sa.Column(
            "user_id",
            sa.Uuid(),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "team_id",
            sa.Uuid(),
            sa.ForeignKey("teams.id"),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "in_progress", "submitted", "scoring", "completed",
                name="battlestatus",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "result",
            sa.Enum("human_win", "ai_win", "draw", "in_progress", name="battleresult"),
            nullable=False,
            server_default="in_progress",
        ),
        sa.Column(
            "mode",
            sa.Enum("competition", "coach", "partner", "reviewer", name="battlemode"),
            nullable=False,
            server_default="competition",
        ),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="intermediate"),
        sa.Column("task_description", sa.Text(), nullable=False),
        sa.Column("human_submission", sa.Text(), nullable=True),
        sa.Column("ai_submission", sa.Text(), nullable=True),
        sa.Column("human_score_quality", sa.Float(), nullable=True),
        sa.Column("human_score_creativity", sa.Float(), nullable=True),
        sa.Column("human_score_execution", sa.Float(), nullable=True),
        sa.Column("human_score_efficiency", sa.Float(), nullable=True),
        sa.Column("human_score_total", sa.Float(), nullable=True),
        sa.Column("ai_score_quality", sa.Float(), nullable=True),
        sa.Column("ai_score_creativity", sa.Float(), nullable=True),
        sa.Column("ai_score_execution", sa.Float(), nullable=True),
        sa.Column("ai_score_efficiency", sa.Float(), nullable=True),
        sa.Column("ai_score_total", sa.Float(), nullable=True),
        sa.Column("human_feedback", sa.Text(), nullable=True),
        sa.Column("ai_feedback", sa.Text(), nullable=True),
        sa.Column("comparison", sa.Text(), nullable=True),
        sa.Column("time_limit_sec", sa.Integer(), nullable=False, server_default="3600"),
        sa.Column("hint_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ai_provider", sa.String(20), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("battles")
    op.drop_table("team_members")
    op.drop_table("teams")
    op.drop_table("leaderboard_entries")
    op.drop_table("point_transactions")
    op.drop_table("user_badges")
    op.drop_table("badges")
    op.drop_table("lesson_progress")
    op.drop_table("enrollments")
    op.drop_table("lessons")
    op.drop_table("modules")
    op.drop_table("courses")
    op.drop_table("users")
    op.drop_table("tenants")

    op.execute("DROP TYPE IF EXISTS questtype")
    op.execute("DROP TYPE IF EXISTS battlemode")
    op.execute("DROP TYPE IF EXISTS battleresult")
    op.execute("DROP TYPE IF EXISTS battlestatus")
    op.execute("DROP TYPE IF EXISTS badgeconditiontype")
    op.execute("DROP TYPE IF EXISTS enrollmentstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
