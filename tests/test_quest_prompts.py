"""Tests for app.ai.prompts.quests - quest prompt building and config"""
import pytest

from app.ai.prompts.quests import (
    QUEST_CONFIGS,
    QuestPromptConfig,
    build_quest_prompt,
    get_eval_weights,
)
from app.ai.providers.base import AIRequest


class TestQuestConfigs:
    def test_all_12_quests_configured(self):
        assert len(QUEST_CONFIGS) == 12
        for i in range(1, 13):
            assert i in QUEST_CONFIGS

    def test_each_quest_has_required_keys(self):
        required = {"name", "type", "approach", "strategy", "temperature", "eval_weights"}
        for quest_id, config in QUEST_CONFIGS.items():
            missing = required - config.keys()
            assert not missing, f"Quest {quest_id} missing: {missing}"

    def test_temperature_has_three_difficulty_levels(self):
        for quest_id, config in QUEST_CONFIGS.items():
            temp = config["temperature"]
            assert "beginner" in temp, f"Quest {quest_id} missing beginner temp"
            assert "intermediate" in temp, f"Quest {quest_id} missing intermediate temp"
            assert "advanced" in temp, f"Quest {quest_id} missing advanced temp"

    def test_temperature_increases_with_easier_difficulty(self):
        for quest_id, config in QUEST_CONFIGS.items():
            temp = config["temperature"]
            assert temp["beginner"] >= temp["intermediate"] >= temp["advanced"], \
                f"Quest {quest_id}: beginner temp should be >= intermediate >= advanced"

    def test_eval_weights_sum_to_one(self):
        for quest_id, config in QUEST_CONFIGS.items():
            total = sum(config["eval_weights"].values())
            assert abs(total - 1.0) < 1e-9, \
                f"Quest {quest_id} eval weights sum to {total}, expected 1.0"

    def test_eval_weights_all_positive(self):
        for quest_id, config in QUEST_CONFIGS.items():
            for criterion, weight in config["eval_weights"].items():
                assert weight > 0, f"Quest {quest_id} criterion '{criterion}' has non-positive weight"

    def test_quest_types_are_known(self):
        known_types = {"analytical", "creative", "communication", "execution"}
        for quest_id, config in QUEST_CONFIGS.items():
            assert config["type"] in known_types, \
                f"Quest {quest_id} has unknown type: {config['type']}"


class TestGetEvalWeights:
    def test_returns_weights_for_known_quest(self):
        weights = get_eval_weights(1)
        assert isinstance(weights, dict)
        assert len(weights) > 0

    def test_unknown_quest_defaults_to_quest_1(self):
        weights_1 = get_eval_weights(1)
        weights_unknown = get_eval_weights(99)
        assert weights_1 == weights_unknown

    def test_all_weights_sum_to_one(self):
        for quest_id in range(1, 13):
            weights = get_eval_weights(quest_id)
            total = sum(weights.values())
            assert abs(total - 1.0) < 1e-9, \
                f"Quest {quest_id} weights sum to {total}"


class TestQuestPromptConfig:
    def test_default_values(self):
        config = QuestPromptConfig(quest_id=1, task_description="분석 과제")
        assert config.temperature == 0.5
        assert config.max_tokens == 4096
        assert config.difficulty == "intermediate"
        assert config.constraints == ()

    def test_custom_values(self):
        config = QuestPromptConfig(
            quest_id=3,
            task_description="사업 제안서",
            constraints=("10분 이내", "A4 1장"),
            difficulty="advanced",
        )
        assert config.quest_id == 3
        assert len(config.constraints) == 2
        assert config.difficulty == "advanced"

    def test_config_is_frozen(self):
        config = QuestPromptConfig(quest_id=1, task_description="test")
        with pytest.raises((AttributeError, TypeError)):
            config.quest_id = 99  # type: ignore[misc]


class TestBuildQuestPrompt:
    def test_returns_ai_request(self):
        config = QuestPromptConfig(quest_id=1, task_description="시장 분석")
        result = build_quest_prompt(config)
        assert isinstance(result, AIRequest)

    def test_quest_id_set(self):
        config = QuestPromptConfig(quest_id=5, task_description="팀 빌딩")
        result = build_quest_prompt(config)
        assert result.quest_id == 5

    def test_system_prompt_contains_persona(self):
        config = QuestPromptConfig(quest_id=1, task_description="분석")
        result = build_quest_prompt(config)
        # Quest 1 persona is "데이터"
        assert "데이터" in result.system_prompt

    def test_user_prompt_contains_task_description(self):
        config = QuestPromptConfig(quest_id=1, task_description="특별 분석 과제입니다")
        result = build_quest_prompt(config)
        assert "특별 분석 과제입니다" in result.user_prompt

    def test_constraints_in_user_prompt(self):
        config = QuestPromptConfig(
            quest_id=1,
            task_description="분석",
            constraints=("페이지 제한: 2장",),
        )
        result = build_quest_prompt(config)
        assert "페이지 제한: 2장" in result.user_prompt

    def test_no_constraints_no_constraints_section(self):
        config = QuestPromptConfig(quest_id=1, task_description="분석")
        result = build_quest_prompt(config)
        assert "제약 조건" not in result.user_prompt

    def test_beginner_difficulty_includes_weakness_hint(self):
        config = QuestPromptConfig(
            quest_id=1, task_description="분석", difficulty="beginner"
        )
        result = build_quest_prompt(config)
        assert "초급" in result.system_prompt

    def test_advanced_difficulty_includes_expert_instruction(self):
        config = QuestPromptConfig(
            quest_id=1, task_description="분석", difficulty="advanced"
        )
        result = build_quest_prompt(config)
        assert "고급" in result.system_prompt

    def test_unknown_quest_falls_back_to_quest_1_persona(self):
        config = QuestPromptConfig(quest_id=99, task_description="분석")
        result = build_quest_prompt(config)
        assert isinstance(result, AIRequest)

    @pytest.mark.parametrize("quest_id", range(1, 13))
    def test_all_quests_build_successfully(self, quest_id: int):
        config = QuestPromptConfig(quest_id=quest_id, task_description="테스트 과제")
        result = build_quest_prompt(config)
        assert result.system_prompt
        assert result.user_prompt
