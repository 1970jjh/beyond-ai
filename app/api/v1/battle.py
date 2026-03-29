from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.collaboration import (
    build_coach_prompt,
    build_partner_prompt,
    build_reviewer_prompt,
)
from app.ai.difficulty import (
    AdaptiveInput,
    apply_difficulty_to_prompt,
    compute_adaptive_difficulty,
    get_difficulty_params,
)
from app.ai.personas import PERSONAS, get_persona
from app.ai.process_view import stream_ai_process
from app.ai.prompts.quests import QuestPromptConfig, build_quest_prompt
from app.ai.router import TaskType, get_ai_router
from app.ai.scoring import calculate_mode_penalty, score_battle
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.battle import Battle, BattleMode, BattleResult, BattleStatus
from app.models.user import User
from app.schemas.battle import (
    AIGenerateResponse,
    BattleListResponse,
    BattleModeSwitch,
    BattleResponse,
    BattleScoresResponse,
    BattleStartRequest,
    BattleSubmitRequest,
    CoachRequest,
    DifficultyParamsResponse,
    DifficultyResponse,
    PersonaResponse,
    ReviewRequest,
    ThinkingStepResponse,
)

router = APIRouter(prefix="/battle", tags=["battle"])


@router.post("/start", response_model=BattleResponse, status_code=201)
async def start_battle(
    body: BattleStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = Battle(
        quest_id=body.quest_id,
        user_id=current_user.id,
        task_description=body.task_description,
        difficulty=body.difficulty,
        time_limit_sec=body.time_limit_sec,
        status=BattleStatus.IN_PROGRESS,
        started_at=datetime.now(UTC),
    )
    db.add(battle)
    await db.flush()
    await db.refresh(battle)

    prompt_config = QuestPromptConfig(
        quest_id=body.quest_id,
        task_description=body.task_description,
        constraints=tuple(body.constraints),
        difficulty=body.difficulty,
    )
    ai_request = build_quest_prompt(prompt_config)

    ai_router = get_ai_router()
    provider = ai_router.select_provider(
        quest_id=body.quest_id,
        difficulty=body.difficulty,
        task_type=TaskType.GENERATE,
    )

    try:
        response = await provider.generate(ai_request)
        battle.ai_submission = response.content
        battle.ai_provider = response.provider.value
    except Exception:
        battle.ai_submission = None
        battle.ai_provider = None

    await db.flush()

    return _to_response(battle)


@router.post("/{battle_id}/submit", response_model=BattleResponse)
async def submit_battle(
    battle_id: str,
    body: BattleSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await _get_battle(db, battle_id, current_user.id)
    if battle.status != BattleStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Battle is not in progress")

    battle.human_submission = body.submission
    battle.submitted_at = datetime.now(UTC)
    battle.status = BattleStatus.SCORING

    if battle.ai_submission:
        try:
            scoring_result = await score_battle(
                quest_id=battle.quest_id,
                quest_description=battle.task_description,
                human_submission=body.submission,
                ai_submission=battle.ai_submission,
            )

            penalty = calculate_mode_penalty(battle.mode.value, battle.hint_count)

            battle.human_score_quality = scoring_result.human_score.quality * penalty
            battle.human_score_creativity = scoring_result.human_score.creativity * penalty
            battle.human_score_execution = scoring_result.human_score.executability * penalty
            battle.human_score_efficiency = scoring_result.human_score.time_efficiency * penalty
            battle.human_score_total = scoring_result.human_score.total * penalty

            battle.ai_score_quality = scoring_result.ai_score.quality
            battle.ai_score_creativity = scoring_result.ai_score.creativity
            battle.ai_score_execution = scoring_result.ai_score.executability
            battle.ai_score_efficiency = scoring_result.ai_score.time_efficiency
            battle.ai_score_total = scoring_result.ai_score.total

            battle.human_feedback = scoring_result.human_score.feedback
            battle.ai_feedback = scoring_result.ai_score.feedback
            battle.comparison = scoring_result.comparison

            if scoring_result.winner == "human":
                battle.result = BattleResult.HUMAN_WIN
            elif scoring_result.winner == "ai":
                battle.result = BattleResult.AI_WIN
            else:
                battle.result = BattleResult.DRAW

        except Exception:
            battle.result = BattleResult.DRAW

    battle.status = BattleStatus.COMPLETED
    battle.completed_at = datetime.now(UTC)
    await db.flush()

    return _to_response(battle)


@router.get("/{battle_id}/stream")
async def stream_battle_ai(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await _get_battle(db, battle_id, current_user.id)

    prompt_config = QuestPromptConfig(
        quest_id=battle.quest_id,
        task_description=battle.task_description,
        difficulty=battle.difficulty,
    )
    ai_request = build_quest_prompt(prompt_config)

    return StreamingResponse(
        stream_ai_process(ai_request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{battle_id}/mode", response_model=BattleResponse)
async def switch_battle_mode(
    battle_id: str,
    body: BattleModeSwitch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await _get_battle(db, battle_id, current_user.id)
    if battle.status != BattleStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Battle is not in progress")

    battle.mode = BattleMode(body.mode)
    await db.flush()
    return _to_response(battle)


@router.post("/{battle_id}/coach", response_model=AIGenerateResponse)
async def get_coach_help(
    battle_id: str,
    body: CoachRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await _get_battle(db, battle_id, current_user.id)
    battle.hint_count = battle.hint_count + 1
    battle.mode = BattleMode.COACH

    ai_request = build_coach_prompt(
        quest_id=battle.quest_id,
        user_question=body.question,
        user_progress=body.current_progress,
    )

    ai_router = get_ai_router()
    provider = ai_router.select_provider(task_type=TaskType.COACH)
    response = await provider.generate(ai_request)
    await db.flush()

    return AIGenerateResponse(
        content=response.content,
        provider=response.provider.value,
        model=response.model,
        thinking_steps=[
            ThinkingStepResponse(
                phase=s.phase, title=s.title, description=s.description,
                thinking=s.thinking, progress=s.progress,
            )
            for s in response.thinking_steps
        ],
    )


@router.post("/{battle_id}/review", response_model=AIGenerateResponse)
async def get_review(
    battle_id: str,
    body: ReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await _get_battle(db, battle_id, current_user.id)

    ai_request = build_reviewer_prompt(
        quest_id=battle.quest_id,
        submission=body.submission,
    )

    ai_router = get_ai_router()
    provider = ai_router.select_provider(task_type=TaskType.GENERATE)
    response = await provider.generate(ai_request)

    return AIGenerateResponse(
        content=response.content,
        provider=response.provider.value,
        model=response.model,
    )


@router.get("/my", response_model=BattleListResponse)
async def my_battles(
    quest_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Battle).where(Battle.user_id == current_user.id)
    if quest_id is not None:
        query = query.where(Battle.quest_id == quest_id)
    query = query.order_by(Battle.created_at.desc())

    result = await db.execute(query)
    battles = result.scalars().all()

    return BattleListResponse(
        battles=[_to_response(b) for b in battles],
        total=len(battles),
    )


@router.get("/{battle_id}", response_model=BattleResponse)
async def get_battle(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await _get_battle(db, battle_id, current_user.id)
    return _to_response(battle)


@router.get("/personas/all", response_model=list[PersonaResponse])
async def list_personas():
    return [
        PersonaResponse(
            id=p.id, name=p.name, title=p.title, personality=p.personality,
            expertise=list(p.expertise), communication_style=p.communication_style,
            catchphrase=p.catchphrase, strengths=list(p.strengths),
            weaknesses=list(p.weaknesses),
        )
        for p in PERSONAS.values()
    ]


@router.get("/personas/{quest_id}", response_model=PersonaResponse)
async def get_quest_persona(quest_id: int):
    persona = get_persona(quest_id)
    return PersonaResponse(
        id=persona.id, name=persona.name, title=persona.title,
        personality=persona.personality, expertise=list(persona.expertise),
        communication_style=persona.communication_style,
        catchphrase=persona.catchphrase, strengths=list(persona.strengths),
        weaknesses=list(persona.weaknesses),
    )


@router.get("/difficulty/{level}", response_model=DifficultyResponse)
async def get_difficulty(level: str):
    params = get_difficulty_params(level)
    return DifficultyResponse(
        level=level,
        params=DifficultyParamsResponse(
            temperature=params.temperature,
            max_tokens=params.max_tokens,
            thinking_depth=params.thinking_depth,
            framework_usage=params.framework_usage,
            human_likeness=params.human_likeness,
        ),
    )


async def _get_battle(db: AsyncSession, battle_id: str, user_id: uuid.UUID) -> Battle:
    result = await db.execute(
        select(Battle).where(
            Battle.id == uuid.UUID(battle_id),
            Battle.user_id == user_id,
        )
    )
    battle = result.scalar_one_or_none()
    if battle is None:
        raise HTTPException(status_code=404, detail="Battle not found")
    return battle


def _to_response(battle: Battle) -> BattleResponse:
    human_scores = None
    if battle.human_score_total is not None:
        human_scores = BattleScoresResponse(
            quality=battle.human_score_quality or 0,
            creativity=battle.human_score_creativity or 0,
            execution=battle.human_score_execution or 0,
            efficiency=battle.human_score_efficiency or 0,
            total=battle.human_score_total or 0,
            feedback=battle.human_feedback or "",
        )

    ai_scores = None
    if battle.ai_score_total is not None:
        ai_scores = BattleScoresResponse(
            quality=battle.ai_score_quality or 0,
            creativity=battle.ai_score_creativity or 0,
            execution=battle.ai_score_execution or 0,
            efficiency=battle.ai_score_efficiency or 0,
            total=battle.ai_score_total or 0,
            feedback=battle.ai_feedback or "",
        )

    return BattleResponse(
        id=str(battle.id),
        quest_id=battle.quest_id,
        status=battle.status.value,
        result=battle.result.value,
        mode=battle.mode.value,
        difficulty=battle.difficulty,
        task_description=battle.task_description,
        human_submission=battle.human_submission,
        ai_submission=battle.ai_submission,
        human_scores=human_scores,
        ai_scores=ai_scores,
        comparison=battle.comparison,
        time_limit_sec=battle.time_limit_sec,
        hint_count=battle.hint_count,
        ai_provider=battle.ai_provider,
    )
