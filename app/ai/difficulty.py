from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DifficultyParams:
    temperature: float
    max_tokens: int
    thinking_depth: int
    data_access_level: int
    response_delay_sec: float
    error_injection_rate: float
    framework_usage: float
    human_likeness: float


DIFFICULTY_PRESETS: dict[str, DifficultyParams] = {
    "beginner": DifficultyParams(
        temperature=0.8,
        max_tokens=2048,
        thinking_depth=2,
        data_access_level=1,
        response_delay_sec=0.0,
        error_injection_rate=0.2,
        framework_usage=0.2,
        human_likeness=0.8,
    ),
    "intermediate": DifficultyParams(
        temperature=0.5,
        max_tokens=4096,
        thinking_depth=3,
        data_access_level=2,
        response_delay_sec=3.0,
        error_injection_rate=0.07,
        framework_usage=0.6,
        human_likeness=0.5,
    ),
    "advanced": DifficultyParams(
        temperature=0.3,
        max_tokens=8192,
        thinking_depth=5,
        data_access_level=3,
        response_delay_sec=0.0,
        error_injection_rate=0.01,
        framework_usage=0.9,
        human_likeness=0.3,
    ),
}


@dataclass(frozen=True)
class AdaptiveInput:
    recent_scores: tuple[float, ...]
    win_rate: float
    consecutive_wins: int
    consecutive_losses: int
    is_first_quest: bool


def get_difficulty_params(level: str) -> DifficultyParams:
    return DIFFICULTY_PRESETS.get(level, DIFFICULTY_PRESETS["intermediate"])


def compute_adaptive_difficulty(current_level: str, stats: AdaptiveInput) -> str:
    levels = ("beginner", "intermediate", "advanced")
    current_idx = levels.index(current_level) if current_level in levels else 1

    if stats.is_first_quest:
        return "beginner"

    new_idx = current_idx

    if stats.win_rate > 0.7:
        new_idx = min(current_idx + 1, 2)
    elif stats.win_rate < 0.3:
        new_idx = max(current_idx - 1, 0)

    if stats.consecutive_wins >= 3:
        new_idx = min(current_idx + 1, 2)
    elif stats.consecutive_losses >= 3:
        new_idx = max(current_idx - 1, 0)

    return levels[new_idx]


def apply_difficulty_to_prompt(base_prompt: str, params: DifficultyParams) -> str:
    depth_labels = {1: "기본", 2: "기본", 3: "표준", 4: "심화", 5: "최고"}
    depth_label = depth_labels.get(params.thinking_depth, "표준")

    access_labels = {1: "기본 데이터", 2: "확장 데이터", 3: "전문가 데이터"}
    access_label = access_labels.get(params.data_access_level, "기본 데이터")

    addendum = f"""

## 분석 수준 지시
- 분석 깊이: {depth_label} 수준
- 데이터 참조 범위: {access_label}
- 전문 프레임워크 활용도: {int(params.framework_usage * 100)}%
- 인간적 표현 수준: {int(params.human_likeness * 100)}%"""

    if params.error_injection_rate > 0.1:
        addendum += """
- 일부 분석에서 의도적으로 표면적인 수준에 머무르세요
- 간단한 실수나 누락을 자연스럽게 포함하세요"""

    return base_prompt + addendum
