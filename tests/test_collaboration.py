"""Tests for app.ai.collaboration - mode switching and prompt building"""
import pytest

from app.ai.collaboration import (
    CollaborationConfig,
    SwitchCondition,
    build_coach_prompt,
    build_partner_prompt,
    build_reviewer_prompt,
    should_suggest_switch,
)
from app.ai.providers.base import AIRequest


class TestShouldSuggestSwitch:
    def _cond(self, **kwargs) -> SwitchCondition:
        return SwitchCondition(**kwargs)

    def test_no_trigger_returns_none(self):
        cond = self._cond()
        assert should_suggest_switch(cond) is None

    def test_user_requests_help_suggests_coach(self):
        cond = self._cond(user_requests_help=True)
        assert should_suggest_switch(cond) == "coach"

    def test_admin_override_suggests_coach(self):
        cond = self._cond(admin_override=True)
        assert should_suggest_switch(cond) == "coach"

    def test_large_score_gap_suggests_coach(self):
        cond = self._cond(score_gap=50.0)
        assert should_suggest_switch(cond) == "coach"

    def test_score_gap_at_threshold_suggests_coach(self):
        cond = self._cond(score_gap=40.0)
        assert should_suggest_switch(cond) == "coach"

    def test_score_gap_below_threshold_no_suggest(self):
        cond = self._cond(score_gap=39.9)
        assert should_suggest_switch(cond) is None

    def test_low_time_remaining_suggests_partner(self):
        cond = self._cond(time_remaining_percent=15.0)
        assert should_suggest_switch(cond) == "partner"

    def test_time_at_threshold_suggests_partner(self):
        cond = self._cond(time_remaining_percent=20.0)
        assert should_suggest_switch(cond) == "partner"

    def test_time_above_threshold_no_suggest(self):
        cond = self._cond(time_remaining_percent=21.0)
        assert should_suggest_switch(cond) is None

    def test_admin_override_takes_priority_over_partner(self):
        # Admin override + low time => should still be coach
        cond = self._cond(admin_override=True, time_remaining_percent=10.0)
        assert should_suggest_switch(cond) == "coach"


class TestBuildCoachPrompt:
    def test_returns_ai_request(self):
        result = build_coach_prompt(
            quest_id=1,
            user_question="시장 규모를 어떻게 계산하나요?",
            user_progress="SWOT 분석까지 완료했습니다.",
        )
        assert isinstance(result, AIRequest)

    def test_quest_id_set(self):
        result = build_coach_prompt(quest_id=3, user_question="q", user_progress="p")
        assert result.quest_id == 3

    def test_temperature_is_coaching_level(self):
        result = build_coach_prompt(quest_id=1, user_question="q", user_progress="p")
        assert result.temperature == pytest.approx(0.6)

    def test_system_prompt_contains_persona_name(self):
        result = build_coach_prompt(quest_id=1, user_question="q", user_progress="p")
        assert "데이터" in result.system_prompt

    def test_user_prompt_contains_question(self):
        result = build_coach_prompt(
            quest_id=1,
            user_question="특수한 질문입니다",
            user_progress="진행 중",
        )
        assert "특수한 질문입니다" in result.user_prompt

    def test_system_prompt_enforces_socratic_method(self):
        result = build_coach_prompt(quest_id=1, user_question="q", user_progress="p")
        assert "소크라테스" in result.system_prompt


class TestBuildPartnerPrompt:
    def test_returns_ai_request(self):
        result = build_partner_prompt(
            quest_id=2,
            task_description="고객 페르소나 3개 설계",
            ai_role="인구통계 분석",
            human_progress="심리 분석 완료",
        )
        assert isinstance(result, AIRequest)

    def test_ai_role_in_user_prompt(self):
        result = build_partner_prompt(
            quest_id=2,
            task_description="과제",
            ai_role="특정 역할명",
            human_progress="진행 상황",
        )
        assert "특정 역할명" in result.user_prompt

    def test_temperature_is_moderate(self):
        result = build_partner_prompt(
            quest_id=1, task_description="t", ai_role="r", human_progress="p"
        )
        assert result.temperature == pytest.approx(0.5)

    def test_max_tokens_larger_than_coach(self):
        coach = build_coach_prompt(quest_id=1, user_question="q", user_progress="p")
        partner = build_partner_prompt(quest_id=1, task_description="t", ai_role="r", human_progress="p")
        assert partner.max_tokens >= coach.max_tokens


class TestBuildReviewerPrompt:
    def test_returns_ai_request(self):
        result = build_reviewer_prompt(quest_id=1, submission="제출 내용입니다.")
        assert isinstance(result, AIRequest)

    def test_submission_in_user_prompt(self):
        result = build_reviewer_prompt(quest_id=1, submission="특별한 제출물")
        assert "특별한 제출물" in result.user_prompt

    def test_system_prompt_requires_strengths_and_improvements(self):
        result = build_reviewer_prompt(quest_id=1, submission="s")
        assert "강점" in result.system_prompt
        assert "개선" in result.system_prompt

    def test_temperature_is_lower_than_coach(self):
        reviewer = build_reviewer_prompt(quest_id=1, submission="s")
        coach = build_coach_prompt(quest_id=1, user_question="q", user_progress="p")
        assert reviewer.temperature < coach.temperature
