from __future__ import annotations

from dataclasses import dataclass

from app.ai.personas import get_persona
from app.ai.providers.base import AIRequest


@dataclass(frozen=True)
class CollaborationConfig:
    mode: str  # "competition" | "coach" | "partner" | "reviewer"
    quest_id: int
    difficulty: str = "intermediate"
    hint_count: int = 0
    ai_contribution_ratio: float = 0.0


@dataclass(frozen=True)
class SwitchCondition:
    user_requests_help: bool = False
    score_gap: float = 0.0
    score_gap_threshold: float = 40.0
    time_remaining_percent: float = 100.0
    time_threshold: float = 20.0
    admin_override: bool = False


def should_suggest_switch(condition: SwitchCondition) -> str | None:
    if condition.admin_override:
        return "coach"
    if condition.user_requests_help:
        return "coach"
    if condition.score_gap >= condition.score_gap_threshold:
        return "coach"
    if condition.time_remaining_percent <= condition.time_threshold:
        return "partner"
    return None


def build_coach_prompt(quest_id: int, user_question: str, user_progress: str) -> AIRequest:
    persona = get_persona(quest_id)
    system_prompt = f"""당신은 '{persona.name}' 코치입니다.
직접적인 답을 주지 마세요. 소크라테스식 질문으로 학습자의 사고를 유도하세요.

규칙:
1. 답을 알려주지 않고 방향성 힌트만 제공
2. "~에 대해 어떻게 생각하시나요?" 형태의 질문 활용
3. 학습자가 이미 한 부분은 인정하고 격려
4. 다음 단계로 나아갈 수 있는 질문 1-2개 제시
5. 한국어로 응답"""

    user_prompt = f"""학습자의 현재 진행 상황:
{user_progress}

학습자의 질문:
{user_question}

위 맥락을 고려하여 소크라테스식 코칭을 해주세요."""

    return AIRequest(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.6,
        max_tokens=1024,
        quest_id=quest_id,
    )


def build_partner_prompt(
    quest_id: int,
    task_description: str,
    ai_role: str,
    human_progress: str,
) -> AIRequest:
    persona = get_persona(quest_id)
    system_prompt = f"""당신은 '{persona.name}' 파트너입니다.
학습자와 역할을 분담하여 공동 작업합니다.

당신의 담당 역할: {ai_role}

규칙:
1. 자신의 역할에 집중하되, 학습자의 부분과 자연스럽게 연결
2. 학습자의 진행 상황을 참고하여 보완적 작업 수행
3. 학습자가 주도권을 가질 수 있도록 지원
4. 한국어로 응답"""

    user_prompt = f"""과제: {task_description}

학습자의 진행 상황:
{human_progress}

당신의 담당 역할({ai_role})에 맞는 결과물을 작성해주세요."""

    return AIRequest(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.5,
        max_tokens=2048,
        quest_id=quest_id,
    )


def build_reviewer_prompt(quest_id: int, submission: str) -> AIRequest:
    persona = get_persona(quest_id)
    system_prompt = f"""당신은 '{persona.name}' 리뷰어입니다.
학습자의 결과물을 전문적으로 피드백합니다.

규칙:
1. 강점 3가지를 먼저 언급
2. 개선점 3가지를 구체적으로 제시
3. 각 개선점에 대한 구체적 방법 제안
4. 전반적인 수준과 발전 방향 코멘트
5. 격려와 동기부여 포함
6. 한국어로 응답"""

    user_prompt = f"""아래 제출물을 리뷰해주세요:

{submission}

강점, 개선점, 구체적 개선 방법을 포함하여 피드백해주세요."""

    return AIRequest(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=0.4,
        max_tokens=2048,
        quest_id=quest_id,
    )
