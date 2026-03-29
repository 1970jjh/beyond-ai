from __future__ import annotations

import logging
from dataclasses import dataclass

from app.ai.providers.base import EvalCriterion, EvalRequest, EvalResult, RubricLevel
from app.ai.prompts.quests import get_eval_weights
from app.ai.router import TaskType, get_ai_router

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class BattleScore:
    quality: float
    creativity: float
    executability: float
    time_efficiency: float
    total: float
    feedback: str


@dataclass(frozen=True)
class ScoringResult:
    human_score: BattleScore
    ai_score: BattleScore
    winner: str  # "human" | "ai" | "draw"
    comparison: str
    detailed_eval: EvalResult


COMMON_CRITERIA = (
    EvalCriterion(
        name="품질",
        weight=0.30,
        description="내용의 정확성, 깊이, 완성도",
        rubric=(
            RubricLevel(score=1, description="기본적인 수준에도 미달, 오류 다수"),
            RubricLevel(score=2, description="기본적인 내용만 포함, 깊이 부족"),
            RubricLevel(score=3, description="적절한 수준의 내용과 정확성"),
            RubricLevel(score=4, description="깊이 있는 분석과 높은 정확성"),
            RubricLevel(score=5, description="전문가 수준의 통찰력과 완벽한 정확성"),
        ),
    ),
    EvalCriterion(
        name="창의성",
        weight=0.25,
        description="독창적 관점, 차별화된 접근, 새로운 아이디어",
        rubric=(
            RubricLevel(score=1, description="독창성 없음, 뻔한 접근"),
            RubricLevel(score=2, description="약간의 차별화 시도"),
            RubricLevel(score=3, description="적절한 창의적 접근"),
            RubricLevel(score=4, description="독창적이고 차별화된 관점"),
            RubricLevel(score=5, description="혁신적이고 놀라운 창의성"),
        ),
    ),
    EvalCriterion(
        name="실행력",
        weight=0.25,
        description="실현 가능성, 구체적 실행 방안, 단계별 계획",
        rubric=(
            RubricLevel(score=1, description="실행 방안 없음, 추상적"),
            RubricLevel(score=2, description="기본적인 실행 계획만 존재"),
            RubricLevel(score=3, description="실현 가능한 구체적 계획"),
            RubricLevel(score=4, description="상세하고 현실적인 실행 로드맵"),
            RubricLevel(score=5, description="즉시 실행 가능한 완벽한 액션 플랜"),
        ),
    ),
    EvalCriterion(
        name="시간효율",
        weight=0.20,
        description="제한 시간 내 완성도, 효율적 자원 활용",
        rubric=(
            RubricLevel(score=1, description="미완성, 시간 내 완료 실패"),
            RubricLevel(score=2, description="기본만 완료, 디테일 부족"),
            RubricLevel(score=3, description="시간 내 적절히 완료"),
            RubricLevel(score=4, description="시간 내 높은 완성도"),
            RubricLevel(score=5, description="시간 내 완벽한 결과물"),
        ),
    ),
)


def build_criteria_for_quest(quest_id: int) -> tuple[EvalCriterion, ...]:
    weights = get_eval_weights(quest_id)
    return tuple(
        EvalCriterion(
            name=c.name,
            weight=weights.get(c.name, c.weight),
            description=c.description,
            rubric=c.rubric,
        )
        for c in COMMON_CRITERIA
    )


async def score_battle(
    quest_id: int,
    quest_description: str,
    human_submission: str,
    ai_submission: str,
    human_time_ratio: float = 1.0,
    ai_time_ratio: float = 1.0,
) -> ScoringResult:
    criteria = build_criteria_for_quest(quest_id)

    eval_request = EvalRequest(
        quest_description=quest_description,
        evaluation_criteria=criteria,
        submission_a=human_submission,
        submission_b=ai_submission,
    )

    router = get_ai_router()
    evaluator = router.select_provider(task_type=TaskType.EVALUATE)
    eval_result = await evaluator.evaluate(eval_request)

    human_score = _extract_battle_score(eval_result.scores_a, criteria, human_time_ratio, eval_result.feedback_a)
    ai_score = _extract_battle_score(eval_result.scores_b, criteria, ai_time_ratio, eval_result.feedback_b)

    if human_score.total > ai_score.total + 2:
        winner = "human"
    elif ai_score.total > human_score.total + 2:
        winner = "ai"
    else:
        winner = "draw"

    return ScoringResult(
        human_score=human_score,
        ai_score=ai_score,
        winner=winner,
        comparison=eval_result.comparison,
        detailed_eval=eval_result,
    )


def _extract_battle_score(
    scores: dict[str, float],
    criteria: tuple[EvalCriterion, ...],
    time_ratio: float,
    feedback: str,
) -> BattleScore:
    quality = scores.get("품질", 50.0)
    creativity = scores.get("창의성", 50.0)
    executability = scores.get("실행력", 50.0)
    time_eff = scores.get("시간효율", 50.0) * min(time_ratio, 1.0)

    weights = {c.name: c.weight for c in criteria}
    total = (
        quality * weights.get("품질", 0.3)
        + creativity * weights.get("창의성", 0.25)
        + executability * weights.get("실행력", 0.25)
        + time_eff * weights.get("시간효율", 0.2)
    )

    return BattleScore(
        quality=quality,
        creativity=creativity,
        executability=executability,
        time_efficiency=time_eff,
        total=round(total, 1),
        feedback=feedback,
    )


def calculate_mode_penalty(mode: str, hint_count: int = 0, ai_contribution: float = 0.0) -> float:
    if mode == "competition":
        return 1.0
    if mode == "coach":
        return max(0.5, 0.85 - hint_count * 0.05)
    if mode == "partner":
        return max(0.4, 0.7 - ai_contribution * 0.3)
    if mode == "reviewer":
        return 0.9
    return 1.0
