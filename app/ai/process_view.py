from __future__ import annotations

import asyncio
import json
import time
from dataclasses import dataclass
from typing import AsyncIterator

from app.ai.providers.base import AIRequest, StreamChunk, ThinkingStep
from app.ai.router import TaskType, get_ai_router


@dataclass(frozen=True)
class ProcessEvent:
    event_type: str  # "step_start" | "step_progress" | "step_complete" | "content" | "insight" | "done"
    step_index: int = 0
    phase: str = ""
    title: str = ""
    description: str = ""
    thinking: str = ""
    progress: int = 0
    content: str = ""
    insight: str = ""


PROCESS_PHASES = (
    ("understanding", "과제 이해", "핵심 요구사항과 제약 조건을 분석합니다"),
    ("analyzing", "데이터 분석", "관련 데이터와 정보를 분석합니다"),
    ("generating", "초안 생성", "분석을 바탕으로 초안을 작성합니다"),
    ("evaluating", "자체 평가", "생성된 결과물을 검토합니다"),
    ("refining", "최종 정제", "피드백을 반영하여 완성합니다"),
)


async def stream_ai_process(request: AIRequest) -> AsyncIterator[str]:
    """Yields SSE-formatted events for the AI thinking process."""
    router = get_ai_router()
    provider = router.select_provider(
        quest_id=request.quest_id,
        task_type=TaskType.PROCESS_VIEW,
    )

    start_time = time.monotonic()
    content_buffer = ""

    async for chunk in provider.stream(request):
        elapsed_ms = int((time.monotonic() - start_time) * 1000)

        if chunk.chunk_type == "thinking" and chunk.thinking_step is not None:
            step = chunk.thinking_step
            phase_idx = _phase_index(step.phase)

            yield _sse_event(ProcessEvent(
                event_type="step_start",
                step_index=phase_idx,
                phase=step.phase,
                title=step.title,
                description=step.description,
                progress=chunk.progress,
            ))

            await asyncio.sleep(0.1)

            yield _sse_event(ProcessEvent(
                event_type="step_complete",
                step_index=phase_idx,
                phase=step.phase,
                title=step.title.replace("중...", "완료"),
                progress=chunk.progress,
            ))

        elif chunk.chunk_type == "content":
            content_buffer += chunk.content
            yield _sse_event(ProcessEvent(
                event_type="content",
                content=chunk.content,
                progress=100,
            ))

        elif chunk.chunk_type == "done":
            yield _sse_event(ProcessEvent(
                event_type="done",
                content=content_buffer,
                progress=100,
            ))

    if not content_buffer:
        response = await provider.generate(request)
        yield _sse_event(ProcessEvent(
            event_type="content",
            content=response.content,
            progress=100,
        ))
        yield _sse_event(ProcessEvent(
            event_type="done",
            content=response.content,
            progress=100,
        ))


def _phase_index(phase: str) -> int:
    for i, (p, _, _) in enumerate(PROCESS_PHASES):
        if p == phase:
            return i
    return 0


def _sse_event(event: ProcessEvent) -> str:
    data = {
        "type": event.event_type,
        "stepIndex": event.step_index,
        "phase": event.phase,
        "title": event.title,
        "description": event.description,
        "thinking": event.thinking,
        "progress": event.progress,
        "content": event.content,
        "insight": event.insight,
    }
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
