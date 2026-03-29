"""Tests for app.ai.router - AIRouter provider selection logic"""
import pytest

from app.ai.router import AIRouter, TaskType, get_ai_router
from app.ai.providers.base import ProviderType


class TestAIRouterProviderSelection:
    def setup_method(self):
        self.router = AIRouter()

    def test_evaluate_task_uses_claude(self):
        provider = self.router.select_provider(task_type=TaskType.EVALUATE)
        assert provider.provider_type == ProviderType.CLAUDE

    def test_process_view_task_uses_claude(self):
        provider = self.router.select_provider(task_type=TaskType.PROCESS_VIEW)
        assert provider.provider_type == ProviderType.CLAUDE

    def test_advanced_difficulty_uses_claude(self):
        provider = self.router.select_provider(
            difficulty="advanced", task_type=TaskType.GENERATE
        )
        assert provider.provider_type == ProviderType.CLAUDE

    def test_intermediate_generate_uses_gemini(self):
        provider = self.router.select_provider(
            difficulty="intermediate", task_type=TaskType.GENERATE
        )
        assert provider.provider_type == ProviderType.GEMINI

    def test_beginner_generate_uses_gemini(self):
        provider = self.router.select_provider(
            difficulty="beginner", task_type=TaskType.GENERATE
        )
        assert provider.provider_type == ProviderType.GEMINI

    def test_coach_task_uses_gemini_for_beginner(self):
        provider = self.router.select_provider(
            difficulty="beginner", task_type=TaskType.COACH
        )
        assert provider.provider_type == ProviderType.GEMINI

    def test_get_provider_claude(self):
        provider = self.router.get_provider(ProviderType.CLAUDE)
        assert provider.provider_type == ProviderType.CLAUDE

    def test_get_provider_gemini(self):
        provider = self.router.get_provider(ProviderType.GEMINI)
        assert provider.provider_type == ProviderType.GEMINI

    def test_gemini_property(self):
        assert self.router.gemini.provider_type == ProviderType.GEMINI

    def test_claude_property(self):
        assert self.router.claude.provider_type == ProviderType.CLAUDE


class TestGetAiRouter:
    def test_returns_ai_router_instance(self):
        router = get_ai_router()
        assert isinstance(router, AIRouter)

    def test_singleton_pattern(self):
        router1 = get_ai_router()
        router2 = get_ai_router()
        assert router1 is router2


class TestTaskType:
    def test_task_type_values(self):
        assert TaskType.GENERATE == "generate"
        assert TaskType.EVALUATE == "evaluate"
        assert TaskType.COACH == "coach"
        assert TaskType.PROCESS_VIEW == "process_view"

    def test_task_type_is_string_enum(self):
        assert isinstance(TaskType.GENERATE, str)
