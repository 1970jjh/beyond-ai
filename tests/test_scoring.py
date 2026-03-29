"""Tests for app.ai.scoring - mode penalty, criteria building, score extraction, battle scoring"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.scoring import (
    BattleScore,
    ScoringResult,
    _extract_battle_score,
    build_criteria_for_quest,
    calculate_mode_penalty,
    score_battle,
)
from app.ai.providers.base import EvalCriterion, EvalResult


class TestCalculateModePenalty:
    def test_competition_mode_no_penalty(self):
        assert calculate_mode_penalty("competition") == 1.0

    def test_competition_ignores_hints(self):
        assert calculate_mode_penalty("competition", hint_count=10) == 1.0

    def test_reviewer_mode_small_penalty(self):
        assert calculate_mode_penalty("reviewer") == 0.9

    def test_coach_no_hints(self):
        assert calculate_mode_penalty("coach", hint_count=0) == 0.85

    def test_coach_one_hint(self):
        assert calculate_mode_penalty("coach", hint_count=1) == pytest.approx(0.80)

    def test_coach_many_hints_floor(self):
        # 0.85 - 20*0.05 = negative => floored at 0.5
        assert calculate_mode_penalty("coach", hint_count=20) == pytest.approx(0.5)

    def test_coach_minimum_is_0_5(self):
        result = calculate_mode_penalty("coach", hint_count=100)
        assert result >= 0.5

    def test_partner_no_contribution(self):
        assert calculate_mode_penalty("partner", ai_contribution=0.0) == pytest.approx(0.7)

    def test_partner_full_contribution_floor(self):
        # 0.7 - 1.0 * 0.3 = 0.4
        assert calculate_mode_penalty("partner", ai_contribution=1.0) == pytest.approx(0.4)

    def test_partner_minimum_is_0_4(self):
        result = calculate_mode_penalty("partner", ai_contribution=10.0)
        assert result >= 0.4

    def test_unknown_mode_no_penalty(self):
        assert calculate_mode_penalty("unknown_mode") == 1.0

    def test_penalty_is_between_0_and_1(self):
        for mode in ("competition", "coach", "partner", "reviewer"):
            result = calculate_mode_penalty(mode, hint_count=5, ai_contribution=0.5)
            assert 0.0 <= result <= 1.0


class TestBuildCriteriaForQuest:
    def test_returns_four_criteria(self):
        criteria = build_criteria_for_quest(1)
        assert len(criteria) == 4

    def test_criteria_names_match_common_names(self):
        criteria = build_criteria_for_quest(1)
        names = {c.name for c in criteria}
        assert names == {"품질", "창의성", "실행력", "시간효율"}

    def test_weights_sum_to_one(self):
        for quest_id in range(1, 13):
            criteria = build_criteria_for_quest(quest_id)
            total = sum(c.weight for c in criteria)
            assert abs(total - 1.0) < 1e-9, f"Quest {quest_id} weights sum to {total}"

    def test_quest_specific_weights_applied(self):
        # Different quests should have different weight distributions
        c1 = {c.name: c.weight for c in build_criteria_for_quest(1)}
        c2 = {c.name: c.weight for c in build_criteria_for_quest(2)}
        # At least one weight should differ between quests
        assert c1 != c2

    def test_all_weights_positive(self):
        for quest_id in range(1, 13):
            for c in build_criteria_for_quest(quest_id):
                assert c.weight > 0, f"Quest {quest_id} criterion {c.name} weight <= 0"


class TestExtractBattleScore:
    def _make_criteria(self) -> tuple[EvalCriterion, ...]:
        return build_criteria_for_quest(1)

    def test_returns_battle_score(self):
        result = _extract_battle_score(
            scores={"품질": 80.0, "창의성": 70.0, "실행력": 75.0, "시간효율": 85.0},
            criteria=self._make_criteria(),
            time_ratio=1.0,
            feedback="좋은 결과",
        )
        assert isinstance(result, BattleScore)

    def test_feedback_preserved(self):
        result = _extract_battle_score(
            scores={},
            criteria=self._make_criteria(),
            time_ratio=1.0,
            feedback="특별한 피드백",
        )
        assert result.feedback == "특별한 피드백"

    def test_time_ratio_caps_at_1(self):
        # time_ratio > 1.0 should be capped at 1.0
        r1 = _extract_battle_score(
            scores={"시간효율": 100.0},
            criteria=self._make_criteria(),
            time_ratio=1.0,
            feedback="",
        )
        r2 = _extract_battle_score(
            scores={"시간효율": 100.0},
            criteria=self._make_criteria(),
            time_ratio=2.0,
            feedback="",
        )
        assert r1.time_efficiency == r2.time_efficiency

    def test_time_ratio_below_1_reduces_efficiency(self):
        result = _extract_battle_score(
            scores={"시간효율": 100.0},
            criteria=self._make_criteria(),
            time_ratio=0.5,
            feedback="",
        )
        assert result.time_efficiency == pytest.approx(50.0)

    def test_missing_scores_default_to_50(self):
        result = _extract_battle_score(
            scores={},
            criteria=self._make_criteria(),
            time_ratio=1.0,
            feedback="",
        )
        assert result.quality == 50.0
        assert result.creativity == 50.0
        assert result.executability == 50.0

    def test_total_is_weighted_sum(self):
        criteria = self._make_criteria()
        weights = {c.name: c.weight for c in criteria}
        scores = {"품질": 80.0, "창의성": 60.0, "실행력": 70.0, "시간효율": 90.0}
        result = _extract_battle_score(scores, criteria, 1.0, "")
        expected = (
            80.0 * weights["품질"]
            + 60.0 * weights["창의성"]
            + 70.0 * weights["실행력"]
            + 90.0 * weights["시간효율"]
        )
        assert result.total == pytest.approx(round(expected, 1))


class TestScoreBattle:
    def _make_eval_result(self, score_a=70.0, score_b=60.0) -> EvalResult:
        return EvalResult(
            scores_a={"품질": score_a, "창의성": score_a, "실행력": score_a, "시간효율": score_a},
            scores_b={"품질": score_b, "창의성": score_b, "실행력": score_b, "시간효율": score_b},
            feedback_a="사람 피드백",
            feedback_b="AI 피드백",
            comparison="비교 분석",
        )

    @pytest.mark.asyncio
    async def test_returns_scoring_result(self):
        mock_evaluator = MagicMock()
        mock_evaluator.evaluate = AsyncMock(return_value=self._make_eval_result())

        with patch("app.ai.scoring.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_evaluator
            mock_router_fn.return_value = mock_router

            result = await score_battle(
                quest_id=1,
                quest_description="시장 분석",
                human_submission="사람 제출물",
                ai_submission="AI 제출물",
            )

        assert isinstance(result, ScoringResult)

    @pytest.mark.asyncio
    async def test_human_wins_when_clearly_higher_score(self):
        # human avg 80, ai avg 60 → diff > 2 → human wins
        mock_evaluator = MagicMock()
        mock_evaluator.evaluate = AsyncMock(return_value=self._make_eval_result(80.0, 60.0))

        with patch("app.ai.scoring.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_evaluator
            mock_router_fn.return_value = mock_router

            result = await score_battle(1, "과제", "사람", "AI")

        assert result.winner == "human"

    @pytest.mark.asyncio
    async def test_ai_wins_when_clearly_higher_score(self):
        mock_evaluator = MagicMock()
        mock_evaluator.evaluate = AsyncMock(return_value=self._make_eval_result(55.0, 80.0))

        with patch("app.ai.scoring.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_evaluator
            mock_router_fn.return_value = mock_router

            result = await score_battle(1, "과제", "사람", "AI")

        assert result.winner == "ai"

    @pytest.mark.asyncio
    async def test_draw_when_scores_close(self):
        # same scores → draw
        mock_evaluator = MagicMock()
        mock_evaluator.evaluate = AsyncMock(return_value=self._make_eval_result(70.0, 70.0))

        with patch("app.ai.scoring.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_evaluator
            mock_router_fn.return_value = mock_router

            result = await score_battle(1, "과제", "사람", "AI")

        assert result.winner == "draw"

    @pytest.mark.asyncio
    async def test_comparison_from_eval_result(self):
        eval_result = self._make_eval_result()
        mock_evaluator = MagicMock()
        mock_evaluator.evaluate = AsyncMock(return_value=eval_result)

        with patch("app.ai.scoring.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_evaluator
            mock_router_fn.return_value = mock_router

            result = await score_battle(1, "과제", "사람", "AI")

        assert result.comparison == "비교 분석"
