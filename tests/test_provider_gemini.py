"""Tests for GeminiProvider — generate, stream, evaluate, and helper functions."""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.providers.base import (
    AIRequest,
    AIResponse,
    EvalCriterion,
    EvalRequest,
    EvalResult,
    ProviderType,
    StreamChunk,
    ThinkingStep,
)
from app.ai.providers.gemini import (
    GeminiProvider,
    _build_eval_prompt,
    _build_payload,
    _extract_text,
    _parse_eval_response,
)


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

class TestBuildPayload:
    def test_basic_payload_without_system(self):
        req = AIRequest(system_prompt="", user_prompt="hello", temperature=0.5, max_tokens=2048)
        payload = _build_payload(req)
        assert len(payload["contents"]) == 1
        assert payload["contents"][0]["role"] == "user"
        assert payload["contents"][0]["parts"][0]["text"] == "hello"
        assert payload["generationConfig"]["temperature"] == 0.5
        assert payload["generationConfig"]["maxOutputTokens"] == 2048

    def test_system_prompt_adds_two_messages(self):
        req = AIRequest(system_prompt="be helpful", user_prompt="question")
        payload = _build_payload(req)
        assert len(payload["contents"]) == 3
        assert "[시스템 지시]" in payload["contents"][0]["parts"][0]["text"]
        assert payload["contents"][1]["role"] == "model"
        assert payload["contents"][2]["parts"][0]["text"] == "question"


class TestExtractText:
    def test_single_candidate(self):
        data = {"candidates": [{"content": {"parts": [{"text": "Hello"}]}}]}
        assert _extract_text(data) == "Hello"

    def test_multiple_parts(self):
        data = {"candidates": [{"content": {"parts": [
            {"text": "Part1"},
            {"text": " Part2"},
        ]}}]}
        assert _extract_text(data) == "Part1 Part2"

    def test_no_candidates(self):
        assert _extract_text({"candidates": []}) == ""
        assert _extract_text({}) == ""

    def test_malformed_data(self):
        assert _extract_text({"candidates": [{}]}) == ""


class TestBuildEvalPrompt:
    def test_contains_all_fields(self):
        req = EvalRequest(
            quest_description="과제",
            evaluation_criteria=(
                EvalCriterion(name="품질", weight=0.6, description="코드 품질"),
            ),
            submission_a="A 코드",
            submission_b="B 코드",
        )
        prompt = _build_eval_prompt(req)
        assert "과제" in prompt
        assert "품질" in prompt
        assert "0.6" in prompt
        assert "A 코드" in prompt
        assert "B 코드" in prompt


class TestParseEvalResponse:
    def test_valid_json(self):
        content = json.dumps({
            "scores_a": {"q": 85}, "scores_b": {"q": 75},
            "total_a": 85, "total_b": 75,
            "feedback_a": "Excellent", "feedback_b": "Good",
            "comparison": "A is superior",
        })
        result = _parse_eval_response(content)
        assert result.total_a == 85.0
        assert result.total_b == 75.0
        assert result.feedback_a == "Excellent"

    def test_json_in_code_block(self):
        content = '```json\n{"scores_a":{}, "scores_b":{}, "total_a":90, "total_b":80, "feedback_a":"f", "feedback_b":"f", "comparison":"c"}\n```'
        result = _parse_eval_response(content)
        assert result.total_a == 90.0

    def test_invalid_json_fallback(self):
        result = _parse_eval_response("not valid json")
        assert result.feedback_a == "평가 파싱 실패"
        assert "not valid" in result.comparison


# ---------------------------------------------------------------------------
# GeminiProvider methods
# ---------------------------------------------------------------------------

@pytest.fixture
def provider():
    with patch("app.ai.providers.gemini.settings") as mock_settings:
        mock_settings.gemini_api_key = "test-gemini-key"
        p = GeminiProvider()
    return p


def _mock_response(data: dict, status_code: int = 200):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = data
    resp.raise_for_status = MagicMock()
    return resp


class TestGeminiGenerate:
    @pytest.mark.asyncio
    async def test_generate_returns_ai_response(self, provider):
        api_data = {
            "candidates": [{"content": {"parts": [{"text": "Gemini answer"}]}}],
            "usageMetadata": {"totalTokenCount": 200},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="sys", user_prompt="question")
            result = await provider.generate(req)

        assert isinstance(result, AIResponse)
        assert result.content == "Gemini answer"
        assert result.provider == ProviderType.GEMINI
        assert result.model == "gemini-2.0-flash"
        assert result.usage_tokens == 200

    @pytest.mark.asyncio
    async def test_generate_url_includes_model(self, provider):
        api_data = {
            "candidates": [{"content": {"parts": [{"text": "ok"}]}}],
            "usageMetadata": {"totalTokenCount": 10},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="hi")
            await provider.generate(req)

        call_args = mock_client.post.call_args
        url = call_args[0][0]
        assert "gemini-2.0-flash:generateContent" in url

    @pytest.mark.asyncio
    async def test_generate_sends_api_key_header(self, provider):
        api_data = {
            "candidates": [{"content": {"parts": [{"text": "ok"}]}}],
            "usageMetadata": {"totalTokenCount": 10},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="hi")
            await provider.generate(req)

        call_kwargs = mock_client.post.call_args
        headers = call_kwargs.kwargs.get("headers") or call_kwargs[1].get("headers", {})
        assert headers.get("x-goog-api-key") == "test-gemini-key"


class TestGeminiStream:
    @pytest.mark.asyncio
    async def test_stream_yields_thinking_then_content_then_done(self, provider):
        lines = [
            'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}',
            'data: {"candidates":[{"content":{"parts":[{"text":" world"}]}}]}',
            "data: [DONE]",
        ]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.aiter_lines = lambda: _async_iter(lines)

        mock_client = AsyncMock()
        mock_stream_ctx = AsyncMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_stream_ctx)

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="test")
            chunks = []
            async for chunk in provider.stream(req):
                chunks.append(chunk)

        types = [c.chunk_type for c in chunks]
        # 5 thinking phases emitted first
        assert types[:5] == ["thinking"] * 5
        # Then content chunks
        content_chunks = [c for c in chunks if c.chunk_type == "content"]
        assert len(content_chunks) == 2
        assert content_chunks[0].content == "Hello"
        assert content_chunks[1].content == " world"
        # Final done
        assert types[-1] == "done"

    @pytest.mark.asyncio
    async def test_stream_skips_non_data_lines(self, provider):
        lines = [
            "event: ping",
            "",
            'data: {"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}',
            "data: [DONE]",
        ]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.aiter_lines = lambda: _async_iter(lines)

        mock_client = AsyncMock()
        mock_stream_ctx = AsyncMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_stream_ctx)

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="test")
            chunks = []
            async for chunk in provider.stream(req):
                chunks.append(chunk)

        content_chunks = [c for c in chunks if c.chunk_type == "content"]
        assert len(content_chunks) == 1

    @pytest.mark.asyncio
    async def test_stream_thinking_phases_have_correct_progress(self, provider):
        lines = ["data: [DONE]"]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.aiter_lines = lambda: _async_iter(lines)

        mock_client = AsyncMock()
        mock_stream_ctx = AsyncMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_stream_ctx)

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="test")
            chunks = []
            async for chunk in provider.stream(req):
                chunks.append(chunk)

        thinking = [c for c in chunks if c.chunk_type == "thinking"]
        assert len(thinking) == 5
        assert thinking[0].progress == 20
        assert thinking[4].progress == 100
        assert thinking[0].thinking_step.phase == "understanding"
        assert thinking[4].thinking_step.phase == "refining"


class TestGeminiEvaluate:
    @pytest.mark.asyncio
    async def test_evaluate_delegates_to_generate(self, provider):
        eval_json = json.dumps({
            "scores_a": {"q": 90}, "scores_b": {"q": 80},
            "total_a": 90, "total_b": 80,
            "feedback_a": "Great", "feedback_b": "Good",
            "comparison": "A wins",
        })
        api_data = {
            "candidates": [{"content": {"parts": [{"text": eval_json}]}}],
            "usageMetadata": {"totalTokenCount": 100},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.gemini.get_http_client", return_value=mock_client):
            req = EvalRequest(
                quest_description="test quest",
                evaluation_criteria=(
                    EvalCriterion(name="q", weight=1.0, description="quality"),
                ),
                submission_a="A",
                submission_b="B",
            )
            result = await provider.evaluate(req)

        assert isinstance(result, EvalResult)
        assert result.total_a == 90.0
        assert result.comparison == "A wins"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _async_iter(items):
    for item in items:
        yield item
