"""Tests for app.ai.scoring - mode penalty logic"""
import pytest

from app.ai.scoring import calculate_mode_penalty


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
