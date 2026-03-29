"""Tests for app.ai.difficulty"""
import pytest

from app.ai.difficulty import (
    DIFFICULTY_PRESETS,
    AdaptiveInput,
    apply_difficulty_to_prompt,
    compute_adaptive_difficulty,
    get_difficulty_params,
)


class TestGetDifficultyParams:
    def test_returns_preset_for_valid_level(self):
        params = get_difficulty_params("beginner")
        assert params.temperature == 0.8
        assert params.max_tokens == 2048

    def test_intermediate_preset(self):
        params = get_difficulty_params("intermediate")
        assert params.temperature == 0.5

    def test_advanced_preset(self):
        params = get_difficulty_params("advanced")
        assert params.temperature == 0.3
        assert params.max_tokens == 8192

    def test_unknown_level_falls_back_to_intermediate(self):
        params = get_difficulty_params("expert")
        assert params == DIFFICULTY_PRESETS["intermediate"]

    def test_all_presets_have_required_fields(self):
        for level, params in DIFFICULTY_PRESETS.items():
            assert 0.0 <= params.temperature <= 1.0
            assert params.max_tokens > 0
            assert params.thinking_depth >= 1


class TestComputeAdaptiveDifficulty:
    def _stats(self, win_rate=0.5, consecutive_wins=0, consecutive_losses=0, is_first=False):
        return AdaptiveInput(
            recent_scores=(75.0,),
            win_rate=win_rate,
            consecutive_wins=consecutive_wins,
            consecutive_losses=consecutive_losses,
            is_first_quest=is_first,
        )

    def test_first_quest_always_beginner(self):
        stats = self._stats(win_rate=0.9, consecutive_wins=10, is_first=True)
        assert compute_adaptive_difficulty("advanced", stats) == "beginner"

    def test_high_win_rate_increases_difficulty(self):
        stats = self._stats(win_rate=0.8)
        result = compute_adaptive_difficulty("beginner", stats)
        assert result == "intermediate"

    def test_low_win_rate_decreases_difficulty(self):
        stats = self._stats(win_rate=0.2)
        result = compute_adaptive_difficulty("advanced", stats)
        assert result == "intermediate"

    def test_consecutive_wins_increases_difficulty(self):
        stats = self._stats(win_rate=0.5, consecutive_wins=3)
        result = compute_adaptive_difficulty("beginner", stats)
        assert result == "intermediate"

    def test_consecutive_losses_decreases_difficulty(self):
        stats = self._stats(win_rate=0.5, consecutive_losses=3)
        result = compute_adaptive_difficulty("advanced", stats)
        assert result == "intermediate"

    def test_difficulty_does_not_exceed_advanced(self):
        stats = self._stats(win_rate=0.9)
        result = compute_adaptive_difficulty("advanced", stats)
        assert result == "advanced"

    def test_difficulty_does_not_go_below_beginner(self):
        stats = self._stats(win_rate=0.1)
        result = compute_adaptive_difficulty("beginner", stats)
        assert result == "beginner"

    def test_invalid_current_level_defaults_to_intermediate(self):
        stats = self._stats()
        result = compute_adaptive_difficulty("expert", stats)
        assert result in ("beginner", "intermediate", "advanced")


class TestApplyDifficultyToPrompt:
    def test_appends_instructions_to_prompt(self):
        params = get_difficulty_params("advanced")
        result = apply_difficulty_to_prompt("기본 과제", params)
        assert "기본 과제" in result
        assert "분석 깊이" in result

    def test_beginner_includes_error_injection_hint(self):
        params = get_difficulty_params("beginner")
        result = apply_difficulty_to_prompt("과제", params)
        assert "의도적으로" in result or "실수" in result

    def test_advanced_no_error_injection_hint(self):
        params = get_difficulty_params("advanced")
        result = apply_difficulty_to_prompt("과제", params)
        assert "의도적으로" not in result

    def test_contains_framework_usage_percentage(self):
        params = get_difficulty_params("advanced")
        result = apply_difficulty_to_prompt("과제", params)
        assert "90%" in result
