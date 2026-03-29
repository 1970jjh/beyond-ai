from __future__ import annotations

import json
import logging
from typing import AsyncIterator

import httpx

from app.core.config import settings

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

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiProvider(AIProvider):
    provider_type = ProviderType.GEMINI

    def __init__(self) -> None:
        self._api_key = settings.gemini_api_key
        self._model = "gemini-2.0-flash"

    async def generate(self, request: AIRequest) -> AIResponse:
        payload = _build_payload(request)
        url = f"{GEMINI_API_URL}/{self._model}:generateContent"
        headers = {"x-goog-api-key": self._api_key}

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        text = _extract_text(data)
        tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)

        return AIResponse(
            content=text,
            provider=ProviderType.GEMINI,
            model=self._model,
            usage_tokens=tokens,
        )

    async def stream(self, request: AIRequest) -> AsyncIterator[StreamChunk]:
        payload = _build_payload(request)
        url = f"{GEMINI_API_URL}/{self._model}:streamGenerateContent?alt=sse"
        headers = {"x-goog-api-key": self._api_key}

        phases = ("understanding", "analyzing", "generating", "evaluating", "refining")
        phase_titles = ("과제 이해", "데이터 분석", "초안 생성", "자체 평가", "최종 정제")

        for i, (phase, title) in enumerate(zip(phases, phase_titles)):
            yield StreamChunk(
                chunk_type="thinking",
                thinking_step=ThinkingStep(
                    phase=phase,
                    title=f"{title} 중...",
                    description=f"AI가 {title} 단계를 수행하고 있습니다",
                    thinking=f"{title} 단계 처리 중",
                    progress=int((i + 1) / len(phases) * 100),
                ),
                progress=int((i + 1) / len(phases) * 100),
            )

        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    raw = line[6:]
                    if raw.strip() == "[DONE]":
                        break
                    try:
                        chunk_data = json.loads(raw)
                        text = _extract_text(chunk_data)
                        if text:
                            yield StreamChunk(chunk_type="content", content=text, progress=100)
                    except (json.JSONDecodeError, KeyError):
                        continue

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


def _build_payload(request: AIRequest) -> dict:
    contents = []
    if request.system_prompt:
        contents.append({
            "role": "user",
            "parts": [{"text": f"[시스템 지시]\n{request.system_prompt}"}],
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "네, 지시를 이해했습니다. 준비되었습니다."}],
        })
    contents.append({
        "role": "user",
        "parts": [{"text": request.user_prompt}],
    })

    return {
        "contents": contents,
        "generationConfig": {
            "temperature": request.temperature,
            "maxOutputTokens": request.max_tokens,
        },
    }


def _extract_text(data: dict) -> str:
    try:
        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(p.get("text", "") for p in parts)
    except (IndexError, KeyError, TypeError):
        return ""


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

각 제출물에 대해 기준별 점수(1-100)를 매기고 JSON으로 응답하세요:
{{
  "scores_a": {{"기준명": 점수, ...}},
  "scores_b": {{"기준명": 점수, ...}},
  "total_a": 총점,
  "total_b": 총점,
  "feedback_a": "A 피드백",
  "feedback_b": "B 피드백",
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
