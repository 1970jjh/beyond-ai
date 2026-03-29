"""Tests for app.ai.personas"""
import pytest

from app.ai.personas import PERSONAS, AIPersona, get_persona


class TestPersonasRegistry:
    def test_all_12_quests_have_personas(self):
        assert len(PERSONAS) == 12
        for i in range(1, 13):
            assert i in PERSONAS

    def test_each_persona_is_ai_persona_instance(self):
        for quest_id, persona in PERSONAS.items():
            assert isinstance(persona, AIPersona), f"Quest {quest_id} has wrong type"

    def test_persona_ids_are_unique(self):
        ids = [p.id for p in PERSONAS.values()]
        assert len(ids) == len(set(ids))

    def test_persona_names_are_unique(self):
        names = [p.name for p in PERSONAS.values()]
        assert len(names) == len(set(names))

    def test_all_personas_have_required_fields(self):
        for quest_id, persona in PERSONAS.items():
            assert persona.id, f"Quest {quest_id} persona missing id"
            assert persona.name, f"Quest {quest_id} persona missing name"
            assert persona.title, f"Quest {quest_id} persona missing title"
            assert persona.personality, f"Quest {quest_id} persona missing personality"
            assert len(persona.expertise) >= 1, f"Quest {quest_id} needs at least 1 expertise"
            assert persona.catchphrase, f"Quest {quest_id} persona missing catchphrase"
            assert len(persona.strengths) >= 1, f"Quest {quest_id} needs at least 1 strength"
            assert len(persona.weaknesses) >= 1, f"Quest {quest_id} needs at least 1 weakness"

    def test_personas_are_frozen(self):
        persona = PERSONAS[1]
        with pytest.raises((AttributeError, TypeError)):
            persona.name = "modified"  # type: ignore[misc]


class TestGetPersona:
    def test_returns_correct_persona_for_known_quest(self):
        persona = get_persona(1)
        assert persona.id == "data"
        assert persona.name == "데이터"

    def test_all_quest_ids_1_to_12(self):
        for quest_id in range(1, 13):
            persona = get_persona(quest_id)
            assert persona is PERSONAS[quest_id]

    def test_unknown_quest_defaults_to_quest_1(self):
        persona = get_persona(99)
        assert persona is PERSONAS[1]

    def test_zero_quest_id_defaults_to_quest_1(self):
        persona = get_persona(0)
        assert persona is PERSONAS[1]

    def test_q5_is_team_builder(self):
        persona = get_persona(5)
        assert "팀" in persona.expertise or "조직" in " ".join(persona.expertise)

    def test_q11_is_mediator(self):
        persona = get_persona(11)
        assert "갈등" in " ".join(persona.expertise) or persona.id == "balance"
