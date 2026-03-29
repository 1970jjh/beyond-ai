"""Tests for app.ai.process_view - SSE event formatting and phase logic"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.ai.process_view import (
    PROCESS_PHASES,
    ProcessEvent,
    _phase_index,
    _sse_event,
    stream_ai_process,
)
from app.ai.providers.base import AIRequest, StreamChunk, ThinkingStep


# ---------------------------------------------------------------------------
# ProcessEvent
# ---------------------------------------------------------------------------

class TestProcessEvent:
    def test_default_values(self):
        ev = ProcessEvent(event_type="done")
        assert ev.step_index == 0
        assert ev.phase == ""
        assert ev.progress == 0
        assert ev.content == ""
        assert ev.insight == ""

    def test_custom_values(self):
        ev = ProcessEvent(
            event_type="step_start",
            step_index=2,
            phase="analyzing",
            title="데이터 분석 중...",
            progress=40,
        )
        assert ev.step_index == 2
        assert ev.phase == "analyzing"
        assert ev.progress == 40

    def test_is_frozen(self):
        ev = ProcessEvent(event_type="done")
        with pytest.raises((AttributeError, TypeError)):
            ev.event_type = "content"  # type: ignore[misc]


# ---------------------------------------------------------------------------
# _phase_index
# ---------------------------------------------------------------------------

class TestPhaseIndex:
    def test_known_phases_return_correct_index(self):
        for i, (phase_key, _, _) in enumerate(PROCESS_PHASES):
            assert _phase_index(phase_key) == i

    def test_first_phase_is_understanding(self):
        assert _phase_index("understanding") == 0

    def test_last_phase_is_refining(self):
        last_key = PROCESS_PHASES[-1][0]
        assert _phase_index(last_key) == len(PROCESS_PHASES) - 1

    def test_unknown_phase_returns_zero(self):
        assert _phase_index("nonexistent_phase") == 0

    def test_empty_string_returns_zero(self):
        assert _phase_index("") == 0


# ---------------------------------------------------------------------------
# _sse_event
# ---------------------------------------------------------------------------

class TestSseEvent:
    def test_returns_sse_format(self):
        ev = ProcessEvent(event_type="done", progress=100)
        result = _sse_event(ev)
        assert result.startswith("data: ")
        assert result.endswith("\n\n")

    def test_json_is_parseable(self):
        ev = ProcessEvent(event_type="content", content="테스트 내용")
        result = _sse_event(ev)
        payload = json.loads(result[len("data: "):].strip())
        assert payload["type"] == "content"
        assert payload["content"] == "테스트 내용"

    def test_all_fields_present(self):
        ev = ProcessEvent(
            event_type="step_start",
            step_index=1,
            phase="analyzing",
            title="분석 중",
            description="설명",
            thinking="생각",
            progress=25,
            content="",
            insight="인사이트",
        )
        payload = json.loads(_sse_event(ev)[len("data: "):].strip())
        assert payload["stepIndex"] == 1
        assert payload["phase"] == "analyzing"
        assert payload["title"] == "분석 중"
        assert payload["description"] == "설명"
        assert payload["thinking"] == "생각"
        assert payload["progress"] == 25
        assert payload["insight"] == "인사이트"

    def test_korean_content_not_escaped(self):
        ev = ProcessEvent(event_type="content", content="한글 테스트")
        result = _sse_event(ev)
        # ensure_ascii=False means Korean chars appear directly
        assert "한글 테스트" in result


# ---------------------------------------------------------------------------
# stream_ai_process
# ---------------------------------------------------------------------------

def _make_request() -> AIRequest:
    return AIRequest(
        quest_id=1,
        system_prompt="system",
        user_prompt="user",
        temperature=0.5,
        max_tokens=1024,
    )


def _thinking_chunk(phase: str, title: str, progress: int) -> StreamChunk:
    step = ThinkingStep(phase=phase, title=title, description="설명", thinking="", progress=progress)
    return StreamChunk(chunk_type="thinking", content="", thinking_step=step, progress=progress)


def _content_chunk(content: str) -> StreamChunk:
    return StreamChunk(chunk_type="content", content=content, progress=80)


def _done_chunk() -> StreamChunk:
    return StreamChunk(chunk_type="done", content="", progress=100)


async def _async_gen(*items):
    for item in items:
        yield item


class TestStreamAiProcess:
    def _make_provider_with_stream(self, *chunks):
        mock_response = MagicMock()
        mock_response.content = ""
        provider = MagicMock()
        provider.stream = MagicMock(return_value=_async_gen(*chunks))
        provider.generate = AsyncMock(return_value=mock_response)
        return provider

    @pytest.mark.asyncio
    async def test_thinking_chunk_emits_step_start_and_complete(self):
        mock_provider = self._make_provider_with_stream(
            _thinking_chunk("understanding", "과제 이해 중...", 10),
            _content_chunk("결과"),
            _done_chunk(),
        )

        with patch("app.ai.process_view.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_provider
            mock_router_fn.return_value = mock_router

            events = []
            async for raw in stream_ai_process(_make_request()):
                events.append(json.loads(raw[len("data: "):].strip()))

        types = [e["type"] for e in events]
        assert "step_start" in types
        assert "step_complete" in types

    @pytest.mark.asyncio
    async def test_step_complete_title_has_완료(self):
        mock_provider = self._make_provider_with_stream(
            _thinking_chunk("understanding", "과제 이해 중...", 10),
            _content_chunk("결과"),
            _done_chunk(),
        )

        with patch("app.ai.process_view.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_provider
            mock_router_fn.return_value = mock_router

            events = []
            async for raw in stream_ai_process(_make_request()):
                events.append(json.loads(raw[len("data: "):].strip()))

        complete = next(e for e in events if e["type"] == "step_complete")
        assert "완료" in complete["title"]

    @pytest.mark.asyncio
    async def test_content_chunk_emits_content_event(self):
        mock_provider = MagicMock()
        mock_provider.stream = MagicMock(
            return_value=_async_gen(
                _content_chunk("결과물 텍스트"),
                _done_chunk(),
            )
        )

        with patch("app.ai.process_view.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_provider
            mock_router_fn.return_value = mock_router

            events = []
            async for raw in stream_ai_process(_make_request()):
                events.append(json.loads(raw[len("data: "):].strip()))

        content_events = [e for e in events if e["type"] == "content"]
        assert len(content_events) == 1
        assert content_events[0]["content"] == "결과물 텍스트"

    @pytest.mark.asyncio
    async def test_done_chunk_emits_done_event_with_accumulated_content(self):
        mock_provider = MagicMock()
        mock_provider.stream = MagicMock(
            return_value=_async_gen(
                _content_chunk("part1 "),
                _content_chunk("part2"),
                _done_chunk(),
            )
        )

        with patch("app.ai.process_view.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_provider
            mock_router_fn.return_value = mock_router

            events = []
            async for raw in stream_ai_process(_make_request()):
                events.append(json.loads(raw[len("data: "):].strip()))

        done = next(e for e in events if e["type"] == "done")
        assert done["content"] == "part1 part2"

    @pytest.mark.asyncio
    async def test_empty_stream_falls_back_to_generate(self):
        mock_response = MagicMock()
        mock_response.content = "폴백 응답"
        mock_provider = MagicMock()
        mock_provider.stream = MagicMock(return_value=_async_gen())  # empty stream
        mock_provider.generate = AsyncMock(return_value=mock_response)

        with patch("app.ai.process_view.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_provider
            mock_router_fn.return_value = mock_router

            events = []
            async for raw in stream_ai_process(_make_request()):
                events.append(json.loads(raw[len("data: "):].strip()))

        mock_provider.generate.assert_called_once()
        content_ev = next(e for e in events if e["type"] == "content")
        assert content_ev["content"] == "폴백 응답"
        done_ev = next(e for e in events if e["type"] == "done")
        assert done_ev["content"] == "폴백 응답"

    @pytest.mark.asyncio
    async def test_process_view_task_type_used_for_routing(self):
        from app.ai.router import TaskType

        mock_response = MagicMock()
        mock_response.content = ""
        mock_provider = MagicMock()
        mock_provider.stream = MagicMock(return_value=_async_gen(_done_chunk()))
        mock_provider.generate = AsyncMock(return_value=mock_response)

        with patch("app.ai.process_view.get_ai_router") as mock_router_fn:
            mock_router = MagicMock()
            mock_router.select_provider.return_value = mock_provider
            mock_router_fn.return_value = mock_router

            async for _ in stream_ai_process(_make_request()):
                pass

        mock_router.select_provider.assert_called_once_with(
            quest_id=1,
            task_type=TaskType.PROCESS_VIEW,
        )
