"""Tests for ClaudeProvider — generate, stream, evaluate, and helper functions."""
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
from app.ai.providers.claude import (
    ClaudeProvider,
    _build_eval_prompt,
    _build_payload,
    _extract_text,
    _extract_thinking,
    _parse_eval_response,
    _split_thinking,
)


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

class TestBuildPayload:
    def test_basic_payload(self):
        req = AIRequest(system_prompt="sys", user_prompt="hello", temperature=0.7, max_tokens=1024)
        payload = _build_payload(req, stream=False)
        assert payload["model"] == "claude-sonnet-4-20250514"
        assert payload["max_tokens"] == 1024
        assert payload["temperature"] == 0.7
        assert payload["messages"] == [{"role": "user", "content": "hello"}]
        assert "stream" not in payload

    def test_system_prompt_included(self):
        req = AIRequest(system_prompt="be helpful", user_prompt="hi")
        payload = _build_payload(req, stream=False)
        assert payload["system"] == "be helpful"

    def test_no_system_prompt(self):
        req = AIRequest(system_prompt="", user_prompt="hi")
        payload = _build_payload(req, stream=False)
        assert "system" not in payload

    def test_stream_flag(self):
        req = AIRequest(system_prompt="", user_prompt="hi")
        payload = _build_payload(req, stream=True)
        assert payload["stream"] is True

    def test_stream_thinking_enabled(self):
        req = AIRequest(system_prompt="", user_prompt="hi", stream_thinking=True)
        payload = _build_payload(req, stream=False)
        assert payload["thinking"] == {"type": "enabled", "budget_tokens": 2048}

    def test_stream_thinking_disabled(self):
        req = AIRequest(system_prompt="", user_prompt="hi", stream_thinking=False)
        payload = _build_payload(req, stream=False)
        assert "thinking" not in payload


class TestExtractText:
    def test_single_text_block(self):
        data = {"content": [{"type": "text", "text": "Hello world"}]}
        assert _extract_text(data) == "Hello world"

    def test_multiple_text_blocks(self):
        data = {"content": [
            {"type": "text", "text": "Part 1"},
            {"type": "text", "text": " Part 2"},
        ]}
        assert _extract_text(data) == "Part 1 Part 2"

    def test_skips_non_text_blocks(self):
        data = {"content": [
            {"type": "thinking", "thinking": "hmm"},
            {"type": "text", "text": "answer"},
        ]}
        assert _extract_text(data) == "answer"

    def test_empty_content(self):
        assert _extract_text({"content": []}) == ""
        assert _extract_text({}) == ""


class TestExtractThinking:
    def test_extracts_thinking_steps(self):
        data = {"content": [
            {"type": "thinking", "thinking": "Step A\n\nStep B\n\nStep C\n\nStep D\n\nStep E"},
            {"type": "text", "text": "result"},
        ]}
        steps = _extract_thinking(data)
        assert len(steps) == 5
        assert steps[0].phase == "understanding"
        assert steps[4].phase == "refining"
        assert steps[0].progress == 20
        assert steps[4].progress == 100

    def test_no_thinking_block(self):
        data = {"content": [{"type": "text", "text": "result"}]}
        assert _extract_thinking(data) == []

    def test_empty_thinking(self):
        data = {"content": [{"type": "thinking", "thinking": ""}]}
        assert _extract_thinking(data) == []


class TestSplitThinking:
    def test_fewer_paragraphs_than_parts(self):
        result = _split_thinking("A\n\nB", 5)
        assert result == ["A", "B"]

    def test_exact_paragraphs(self):
        result = _split_thinking("A\n\nB\n\nC", 3)
        assert len(result) == 3

    def test_more_paragraphs_than_parts(self):
        text = "\n\n".join(f"P{i}" for i in range(10))
        result = _split_thinking(text, 5)
        assert len(result) == 5

    def test_empty_text(self):
        assert _split_thinking("", 5) == []


class TestBuildEvalPrompt:
    def test_contains_criteria_and_submissions(self):
        req = EvalRequest(
            quest_description="과제 설명",
            evaluation_criteria=(
                EvalCriterion(name="품질", weight=0.5, description="코드 품질"),
                EvalCriterion(name="창의성", weight=0.5, description="독창적 접근"),
            ),
            submission_a="제출물 A",
            submission_b="제출물 B",
        )
        prompt = _build_eval_prompt(req)
        assert "과제 설명" in prompt
        assert "품질" in prompt
        assert "창의성" in prompt
        assert "제출물 A" in prompt
        assert "제출물 B" in prompt
        assert "0.5" in prompt


class TestParseEvalResponse:
    def test_valid_json(self):
        content = json.dumps({
            "scores_a": {"quality": 80},
            "scores_b": {"quality": 70},
            "total_a": 80,
            "total_b": 70,
            "feedback_a": "Good",
            "feedback_b": "OK",
            "comparison": "A is better",
        })
        result = _parse_eval_response(content)
        assert result.total_a == 80.0
        assert result.total_b == 70.0
        assert result.feedback_a == "Good"

    def test_json_in_code_block(self):
        content = '```json\n{"scores_a": {}, "scores_b": {}, "total_a": 90, "total_b": 85, "feedback_a": "f", "feedback_b": "f", "comparison": "c"}\n```'
        result = _parse_eval_response(content)
        assert result.total_a == 90.0

    def test_invalid_json_returns_fallback(self):
        result = _parse_eval_response("not json at all")
        assert result.feedback_a == "평가 파싱 실패"
        assert "not json" in result.comparison


# ---------------------------------------------------------------------------
# ClaudeProvider methods
# ---------------------------------------------------------------------------

@pytest.fixture
def provider():
    with patch("app.ai.providers.claude.settings") as mock_settings:
        mock_settings.claude_api_key = "test-key"
        p = ClaudeProvider()
    return p


def _mock_response(data: dict, status_code: int = 200):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = data
    resp.raise_for_status = MagicMock()
    return resp


class TestClaudeGenerate:
    @pytest.mark.asyncio
    async def test_generate_returns_ai_response(self, provider):
        api_data = {
            "content": [{"type": "text", "text": "Generated answer"}],
            "usage": {"input_tokens": 100, "output_tokens": 50},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.claude.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="sys", user_prompt="question")
            result = await provider.generate(req)

        assert isinstance(result, AIResponse)
        assert result.content == "Generated answer"
        assert result.provider == ProviderType.CLAUDE
        assert result.usage_tokens == 150

    @pytest.mark.asyncio
    async def test_generate_with_thinking(self, provider):
        api_data = {
            "content": [
                {"type": "thinking", "thinking": "A\n\nB\n\nC\n\nD\n\nE"},
                {"type": "text", "text": "Final answer"},
            ],
            "usage": {"input_tokens": 200, "output_tokens": 100},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.claude.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="sys", user_prompt="q", stream_thinking=True)
            result = await provider.generate(req)

        assert result.content == "Final answer"
        assert len(result.thinking_steps) == 5


class TestClaudeStream:
    @pytest.mark.asyncio
    async def test_stream_yields_thinking_and_content(self, provider):
        lines = [
            'data: {"type":"content_block_start","content_block":{"type":"thinking"}}',
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}',
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}',
            'data: {"type":"message_stop"}',
        ]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.aiter_lines = lambda: _async_iter(lines)

        mock_client = AsyncMock()
        mock_stream_ctx = AsyncMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_stream_ctx)

        with patch("app.ai.providers.claude.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="test")
            chunks = []
            async for chunk in provider.stream(req):
                chunks.append(chunk)

        types = [c.chunk_type for c in chunks]
        assert "thinking" in types
        assert "content" in types
        assert types[-1] == "done"

    @pytest.mark.asyncio
    async def test_stream_skips_non_data_lines(self, provider):
        lines = [
            "event: ping",
            "",
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hi"}}',
            'data: {"type":"message_stop"}',
        ]

        mock_resp = MagicMock()
        mock_resp.raise_for_status = MagicMock()
        mock_resp.aiter_lines = lambda: _async_iter(lines)

        mock_client = AsyncMock()
        mock_stream_ctx = AsyncMock()
        mock_stream_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
        mock_stream_ctx.__aexit__ = AsyncMock(return_value=False)
        mock_client.stream = MagicMock(return_value=mock_stream_ctx)

        with patch("app.ai.providers.claude.get_http_client", return_value=mock_client):
            req = AIRequest(system_prompt="", user_prompt="test")
            chunks = []
            async for chunk in provider.stream(req):
                chunks.append(chunk)

        content_chunks = [c for c in chunks if c.chunk_type == "content"]
        assert len(content_chunks) == 1
        assert content_chunks[0].content == "hi"


class TestClaudeEvaluate:
    @pytest.mark.asyncio
    async def test_evaluate_delegates_to_generate(self, provider):
        eval_json = json.dumps({
            "scores_a": {"q": 80}, "scores_b": {"q": 70},
            "total_a": 80, "total_b": 70,
            "feedback_a": "Good", "feedback_b": "OK",
            "comparison": "A wins",
        })
        api_data = {
            "content": [{"type": "text", "text": eval_json}],
            "usage": {"input_tokens": 50, "output_tokens": 50},
        }
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=_mock_response(api_data))

        with patch("app.ai.providers.claude.get_http_client", return_value=mock_client):
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
        assert result.total_a == 80.0
        assert result.comparison == "A wins"


class TestClaudeHeaders:
    def test_headers_contain_api_key(self, provider):
        with patch.object(provider, "_api_key", "sk-test"):
            headers = provider._headers()
        assert headers["x-api-key"] == "sk-test"
        assert headers["anthropic-version"] == "2023-06-01"
        assert headers["content-type"] == "application/json"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _async_iter(items):
    for item in items:
        yield item
