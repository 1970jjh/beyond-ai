from __future__ import annotations

from dataclasses import dataclass

from app.ai.personas import AIPersona, get_persona
from app.ai.providers.base import AIRequest


@dataclass(frozen=True)
class QuestPromptConfig:
    quest_id: int
    task_description: str
    constraints: tuple[str, ...] = ()
    temperature: float = 0.5
    max_tokens: int = 4096
    difficulty: str = "intermediate"


QUEST_CONFIGS: dict[int, dict] = {
    1: {
        "name": "시장 분석 리포트",
        "type": "analytical",
        "approach": "구조화된 데이터 분석 + SWOT/PESTLE 프레임워크",
        "strategy": "Chain-of-Thought로 시장 데이터에서 인사이트를 도출하고 전략을 제안합니다",
        "temperature": {"beginner": 0.8, "intermediate": 0.5, "advanced": 0.3},
        "eval_weights": {"품질": 0.30, "창의성": 0.20, "실행력": 0.30, "시간효율": 0.20},
    },
    2: {
        "name": "고객 페르소나 설계",
        "type": "creative",
        "approach": "인구통계 + 심리통계 기반 페르소나 생성",
        "strategy": "Few-shot으로 우수 페르소나 예시를 참조하여 생성합니다",
        "temperature": {"beginner": 0.9, "intermediate": 0.6, "advanced": 0.4},
        "eval_weights": {"품질": 0.25, "창의성": 0.30, "실행력": 0.25, "시간효율": 0.20},
    },
    3: {
        "name": "사업 제안서 작성",
        "type": "analytical",
        "approach": "시장 기회 분석 -> 비즈니스 모델 -> 재무 전망",
        "strategy": "Step-by-step 구조화와 실제 시장 데이터를 참조합니다",
        "temperature": {"beginner": 0.7, "intermediate": 0.5, "advanced": 0.3},
        "eval_weights": {"품질": 0.30, "창의성": 0.25, "실행력": 0.30, "시간효율": 0.15},
    },
    4: {
        "name": "위기 대응 시뮬레이션",
        "type": "execution",
        "approach": "시나리오 분석 -> 리스크 매트릭스 -> 대응 프로토콜",
        "strategy": "Role-play + Multi-turn으로 상황 전개에 따른 대응을 수립합니다",
        "temperature": {"beginner": 0.7, "intermediate": 0.4, "advanced": 0.3},
        "eval_weights": {"품질": 0.25, "창의성": 0.20, "실행력": 0.35, "시간효율": 0.20},
    },
    5: {
        "name": "팀 빌딩 챌린지",
        "type": "creative",
        "approach": "팀 역학 분석 -> 활동 설계 -> 효과 측정 방안",
        "strategy": "조직심리학 프레임워크 기반 분석과 창의적 활동을 설계합니다",
        "temperature": {"beginner": 0.9, "intermediate": 0.7, "advanced": 0.5},
        "eval_weights": {"품질": 0.25, "창의성": 0.30, "실행력": 0.25, "시간효율": 0.20},
    },
    6: {
        "name": "프레젠테이션 배틀",
        "type": "communication",
        "approach": "스토리텔링 구조 -> 슬라이드 설계 -> 핵심 메시지 정리",
        "strategy": "설득의 3요소(에토스/파토스/로고스) 기반으로 구성합니다",
        "temperature": {"beginner": 0.8, "intermediate": 0.6, "advanced": 0.4},
        "eval_weights": {"품질": 0.25, "창의성": 0.25, "실행력": 0.25, "시간효율": 0.25},
    },
    7: {
        "name": "프로세스 혁신",
        "type": "analytical",
        "approach": "As-Is 분석 -> 병목 식별 -> To-Be 프로세스 설계",
        "strategy": "린 시그마 + 디자인 씽킹 프레임워크를 적용합니다",
        "temperature": {"beginner": 0.8, "intermediate": 0.5, "advanced": 0.3},
        "eval_weights": {"품질": 0.30, "창의성": 0.25, "실행력": 0.30, "시간효율": 0.15},
    },
    8: {
        "name": "고객 응대 롤플레이",
        "type": "communication",
        "approach": "고객 유형 분류 -> 상황별 스크립트 -> 감정 분석 대응",
        "strategy": "Multi-turn 대화 시뮬레이션과 감정 인식 프롬프트를 활용합니다",
        "temperature": {"beginner": 0.8, "intermediate": 0.5, "advanced": 0.3},
        "eval_weights": {"품질": 0.25, "창의성": 0.20, "실행력": 0.30, "시간효율": 0.25},
    },
    9: {
        "name": "데이터 기반 의사결정",
        "type": "analytical",
        "approach": "데이터 탐색 -> 통계 분석 -> 시각화 -> 의사결정 제안",
        "strategy": "Code Interpreter 스타일 분석과 해석 프롬프트를 사용합니다",
        "temperature": {"beginner": 0.6, "intermediate": 0.3, "advanced": 0.2},
        "eval_weights": {"품질": 0.35, "창의성": 0.15, "실행력": 0.30, "시간효율": 0.20},
    },
    10: {
        "name": "신제품 아이디어톤",
        "type": "creative",
        "approach": "트렌드 분석 -> 아이디어 발산 -> 컨셉 정교화 -> MVP 설계",
        "strategy": "브레인스토밍 프롬프트와 실현 가능성 필터링을 병행합니다",
        "temperature": {"beginner": 0.95, "intermediate": 0.8, "advanced": 0.6},
        "eval_weights": {"품질": 0.20, "창의성": 0.35, "실행력": 0.25, "시간효율": 0.20},
    },
    11: {
        "name": "갈등 해결 시뮬레이션",
        "type": "communication",
        "approach": "갈등 유형 분석 -> 이해관계자 매핑 -> 중재 전략 수립",
        "strategy": "다중 관점 분석 프롬프트와 협상 시뮬레이션을 수행합니다",
        "temperature": {"beginner": 0.7, "intermediate": 0.4, "advanced": 0.3},
        "eval_weights": {"품질": 0.25, "창의성": 0.20, "실행력": 0.30, "시간효율": 0.25},
    },
    12: {
        "name": "연간 성과 발표회",
        "type": "analytical",
        "approach": "데이터 종합 -> 성장 스토리 -> 인사이트 + 미래 제안",
        "strategy": "이전 11개월 결과 컨텍스트를 주입하여 종합 분석합니다",
        "temperature": {"beginner": 0.8, "intermediate": 0.5, "advanced": 0.3},
        "eval_weights": {"품질": 0.30, "창의성": 0.25, "실행력": 0.20, "시간효율": 0.25},
    },
}


def build_quest_prompt(config: QuestPromptConfig) -> AIRequest:
    quest = QUEST_CONFIGS.get(config.quest_id, QUEST_CONFIGS[1])
    persona = get_persona(config.quest_id)
    temperature = quest["temperature"].get(config.difficulty, 0.5)

    system_prompt = _build_system_prompt(persona, quest, config)
    user_prompt = _build_user_prompt(quest, config)

    return AIRequest(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        temperature=temperature,
        max_tokens=config.max_tokens,
        quest_id=config.quest_id,
        stream_thinking=True,
    )


def _build_system_prompt(persona: AIPersona, quest: dict, config: QuestPromptConfig) -> str:
    difficulty_instruction = _get_difficulty_instruction(config.difficulty, persona)

    return f"""당신은 '{persona.name}'입니다. {persona.title}로서 활동합니다.

## 캐릭터 설정
- 성격: {persona.personality}
- 전문 분야: {', '.join(persona.expertise)}
- 소통 스타일: {persona.communication_style}
- 시그니처: "{persona.catchphrase}"

## 과제 접근 방식
{quest['strategy']}

## 접근 프레임워크
{quest['approach']}

{difficulty_instruction}

## 응답 규칙
1. {persona.name}의 성격과 전문성을 일관되게 유지하세요
2. 단계별로 사고 과정을 명확히 보여주세요
3. 전문 프레임워크를 적절히 활용하세요
4. 결론에는 구체적이고 실행 가능한 제안을 포함하세요
5. 한국어로 응답하세요"""


def _build_user_prompt(quest: dict, config: QuestPromptConfig) -> str:
    constraints_text = ""
    if config.constraints:
        constraints_text = "\n\n## 제약 조건\n" + "\n".join(f"- {c}" for c in config.constraints)

    return f"""## 퀘스트: {quest['name']}

### 과제 설명
{config.task_description}
{constraints_text}

### 요구사항
위 과제를 다음 단계로 수행해주세요:
1. 과제 핵심 요구사항 파악
2. 관련 데이터/정보 분석
3. 프레임워크 적용 및 초안 작성
4. 자체 검토 및 품질 평가
5. 최종 정제 및 완성

각 단계의 사고 과정을 명확히 보여주며 결과물을 작성해주세요."""


def _get_difficulty_instruction(difficulty: str, persona: AIPersona) -> str:
    if difficulty == "beginner":
        return f"""## 난이도 조절 (초급)
- 기본적인 프레임워크만 사용합니다
- 일부 분석에서 의도적으로 표면적인 수준에 머뭅니다
- 다음 약점이 두드러지게 나타나야 합니다: {', '.join(persona.weaknesses)}
- 학습자가 이길 수 있는 여지를 남깁니다
- 전문 용어 사용을 최소화합니다"""

    if difficulty == "advanced":
        return f"""## 난이도 조절 (고급)
- 최고 수준의 전문 프레임워크와 분석을 적용합니다
- 다층적이고 정교한 분석을 수행합니다
- 약점이 거의 드러나지 않는 범용적 전문가 수준으로 응답합니다
- 최신 트렌드와 고급 방법론을 적극 활용합니다
- 실행 가능한 구체적 제안을 다수 포함합니다"""

    return f"""## 난이도 조절 (중급)
- 업계 표준 수준의 프레임워크를 활용합니다
- 균형 잡힌 분석을 수행하되, 일부 영역에서 약점이 드러납니다
- 다음 약점이 약간 보정된 형태로 나타납니다: {', '.join(persona.weaknesses[:2])}
- 전문적이면서도 접근 가능한 수준을 유지합니다"""


def get_eval_weights(quest_id: int) -> dict[str, float]:
    quest = QUEST_CONFIGS.get(quest_id, QUEST_CONFIGS[1])
    return quest["eval_weights"]
