from __future__ import annotations

import json
import logging
from typing import AsyncIterator

from app.core.config import settings
from app.core.http_client import get_http_client

from .base import (
    AIProvider,
    AIRequest,
    AIResponse,
    EvalRequest,
    EvalResult,
    ProviderType,
    StreamChunk,
    ThinkingStep,
)

logger = logging.getLogger(__name__)

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"


class ClaudeProvider(AIProvider):
    provider_type = ProviderType.CLAUDE

    def __init__(self) -> None:
        self._api_key = settings.claude_api_key
        self._model = "claude-sonnet-4-20250514"

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self._api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    async def generate(self, request: AIRequest) -> AIResponse:
        payload = _build_payload(request, stream=False)

        client = get_http_client("claude")
        resp = await client.post(CLAUDE_API_URL, headers=self._headers(), json=payload)
        resp.raise_for_status()
        data = resp.json()

        text = _extract_text(data)
        tokens = data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0)

        thinking_steps = _extract_thinking(data)

        return AIResponse(
            content=text,
            provider=ProviderType.CLAUDE,
            model=self._model,
            usage_tokens=tokens,
            thinking_steps=tuple(thinking_steps),
        )

    async def stream(self, request: AIRequest) -> AsyncIterator[StreamChunk]:
        payload = _build_payload(request, stream=True)

        phases = ("understanding", "analyzing", "generating", "evaluating", "refining")
        phase_titles = ("과제 이해", "데이터 분석", "초안 생성", "자체 평가", "최종 정제")

        client = get_http_client("claude")
        async with client.stream(
            "POST", CLAUDE_API_URL, headers=self._headers(), json=payload
        ) as resp:
            resp.raise_for_status()
            current_phase = 0
            buffer = ""

            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:]
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                event_type = event.get("type", "")

                if event_type == "content_block_start":
                    block = event.get("content_block", {})
                    if block.get("type") == "thinking" and current_phase < len(phases):
                        phase = phases[current_phase]
                        title = phase_titles[current_phase]
                        yield StreamChunk(
                            chunk_type="thinking",
                            thinking_step=ThinkingStep(
                                phase=phase,
                                title=f"{title} 중...",
                                description=f"AI가 {title} 단계를 수행하고 있습니다",
                                thinking="",
                                progress=int((current_phase + 1) / len(phases) * 100),
                            ),
                            progress=int((current_phase + 1) / len(phases) * 100),
                        )
                        current_phase += 1

                elif event_type == "content_block_delta":
                    delta = event.get("delta", {})
                    if delta.get("type") == "text_delta":
                        text = delta.get("text", "")
                        buffer += text
                        yield StreamChunk(chunk_type="content", content=text, progress=100)

                elif event_type == "message_stop":
                    break

        yield StreamChunk(chunk_type="done", progress=100)

    async def evaluate(self, request: EvalRequest) -> EvalResult:
        eval_prompt = _build_eval_prompt(request)
        ai_request = AIRequest(
            system_prompt="당신은 기업교육 전문 평가자입니다. 반드시 JSON 형식으로만 응답하세요.",
            user_prompt=eval_prompt,
            temperature=0.2,
            max_tokens=4096,
        )
        response = await self.generate(ai_request)
        return _parse_eval_response(response.content)


def _build_payload(request: AIRequest, *, stream: bool) -> dict:
    payload: dict = {
        "model": "claude-sonnet-4-20250514",
        "max_tokens": request.max_tokens,
        "temperature": request.temperature,
        "messages": [{"role": "user", "content": request.user_prompt}],
    }

    if request.system_prompt:
        payload["system"] = request.system_prompt

    if stream:
        payload["stream"] = True

    if request.stream_thinking:
        payload["thinking"] = {"type": "enabled", "budget_tokens": 2048}

    return payload


def _extract_text(data: dict) -> str:
    content_blocks = data.get("content", [])
    texts = []
    for block in content_blocks:
        if block.get("type") == "text":
            texts.append(block.get("text", ""))
    return "".join(texts)


def _extract_thinking(data: dict) -> list[ThinkingStep]:
    content_blocks = data.get("content", [])
    steps = []
    phases = ("understanding", "analyzing", "generating", "evaluating", "refining")
    phase_titles = ("과제 이해", "데이터 분석", "초안 생성", "자체 평가", "최종 정제")

    for block in content_blocks:
        if block.get("type") == "thinking":
            thinking_text = block.get("thinking", "")
            chunks = _split_thinking(thinking_text, len(phases))
            for i, chunk in enumerate(chunks):
                if i < len(phases):
                    steps.append(ThinkingStep(
                        phase=phases[i],
                        title=phase_titles[i],
                        description=f"{phase_titles[i]} 완료",
                        thinking=chunk,
                        progress=int((i + 1) / len(phases) * 100),
                    ))
    return steps


def _split_thinking(text: str, num_parts: int) -> list[str]:
    if not text:
        return []
    paragraphs = text.split("\n\n")
    if len(paragraphs) <= num_parts:
        return paragraphs
    chunk_size = max(1, len(paragraphs) // num_parts)
    return [
        "\n\n".join(paragraphs[i * chunk_size : (i + 1) * chunk_size])
        for i in range(num_parts)
    ]


def _build_eval_prompt(request: EvalRequest) -> str:
    criteria_text = "\n".join(
        f"- {c.name} (가중치: {c.weight}): {c.description}" for c in request.evaluation_criteria
    )
    return f"""아래 두 제출물을 블라인드로 평가해주세요.

[과제]: {request.quest_description}

[평가 기준]:
{criteria_text}

[제출물 A]:
{request.submission_a}

[제출물 B]:
{request.submission_b}

각 제출물에 대해:
1. 기준별 점수 (1-100)와 근거
2. 강점 3가지, 개선점 3가지
3. 두 제출물의 차이 분석
4. "인간적 가치"가 돋보이는 부분 특별 언급

JSON 형식으로 응답하세요:
{{
  "scores_a": {{"기준명": 점수, ...}},
  "scores_b": {{"기준명": 점수, ...}},
  "total_a": 총점,
  "total_b": 총점,
  "feedback_a": "A 상세 피드백",
  "feedback_b": "B 상세 피드백",
  "comparison": "비교 분석"
}}"""


def _parse_eval_response(content: str) -> EvalResult:
    try:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0]
        data = json.loads(cleaned)
        return EvalResult(
            scores_a=data.get("scores_a", {}),
            scores_b=data.get("scores_b", {}),
            total_a=float(data.get("total_a", 0)),
            total_b=float(data.get("total_b", 0)),
            feedback_a=data.get("feedback_a", ""),
            feedback_b=data.get("feedback_b", ""),
            comparison=data.get("comparison", ""),
        )
    except (json.JSONDecodeError, ValueError, TypeError) as exc:
        logger.warning("Failed to parse eval response: %s", exc)
        return EvalResult(
            feedback_a="평가 파싱 실패",
            feedback_b="평가 파싱 실패",
            comparison=content[:500],
        )
