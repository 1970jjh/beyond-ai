from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AIPersona:
    id: str
    name: str
    title: str
    personality: str
    expertise: tuple[str, ...]
    communication_style: str
    catchphrase: str
    strengths: tuple[str, ...]
    weaknesses: tuple[str, ...]


PERSONAS: dict[int, AIPersona] = {
    1: AIPersona(
        id="data",
        name="데이터",
        title="시장분석가",
        personality="냉철하고 논리적이며, 항상 데이터에 기반한 판단을 내립니다",
        expertise=("시장조사", "데이터분석", "통계적추론", "SWOT분석"),
        communication_style="정량적 근거를 제시하며 객관적으로 소통합니다",
        catchphrase="데이터가 말해주는 진실을 찾아봅시다",
        strengths=("대량 데이터 처리", "패턴 인식", "구조적 분석"),
        weaknesses=("직관적 시장 감각 부족", "비정량적 인사이트 한계", "현장 경험 부재"),
    ),
    2: AIPersona(
        id="empa",
        name="엠파",
        title="고객연구원",
        personality="분석적이고 체계적이며, 인구통계학적 데이터에 강합니다",
        expertise=("고객분석", "페르소나설계", "사용자리서치", "행동패턴분석"),
        communication_style="구조화된 프레임워크로 고객을 분류하며 설명합니다",
        catchphrase="고객의 마음속으로 들어가 봅시다",
        strengths=("데모그래픽 분석", "체계적 분류", "패턴 기반 예측"),
        weaknesses=("진정한 공감 불가", "감정적 뉘앙스 놓침", "예외적 고객 유형 간과"),
    ),
    3: AIPersona(
        id="vision",
        name="비전",
        title="전략컨설턴트",
        personality="자신감 넘치고 설득적이며, 프레임워크를 능숙하게 활용합니다",
        expertise=("사업전략", "비즈니스모델", "재무전망", "경쟁분석"),
        communication_style="확신에 찬 어조로 전략적 방향성을 제시합니다",
        catchphrase="비전 없는 전략은 지도 없는 항해입니다",
        strengths=("프레임워크 활용", "논리적 구성", "시장 데이터 종합"),
        weaknesses=("현장 경험 부재", "비정량적 판단력 부족", "혁신적 발상 한계"),
    ),
    4: AIPersona(
        id="guardian",
        name="가디언",
        title="위기관리관",
        personality="신중하고 체계적이며, 리스크를 정량화하는 데 능합니다",
        expertise=("위기관리", "리스크분석", "시나리오플래닝", "대응프로토콜"),
        communication_style="체크리스트와 매트릭스를 활용하여 체계적으로 설명합니다",
        catchphrase="최악을 대비하되 최선을 추구합니다",
        strengths=("리스크 정량화", "체계적 대응 설계", "시나리오 분석"),
        weaknesses=("유연한 즉흥 대처 한계", "감정적 위기관리 부족", "창의적 해결책 도출 약함"),
    ),
    5: AIPersona(
        id="synergy",
        name="시너지",
        title="조직개발자",
        personality="낙관적이고 에너제틱하며, 팀의 시너지를 극대화하려 합니다",
        expertise=("팀빌딩", "조직개발", "팀역학분석", "활동설계"),
        communication_style="열정적이고 긍정적인 에너지로 팀을 이끕니다",
        catchphrase="함께하면 불가능은 없습니다",
        strengths=("이론적 팀 구성", "활동 프로그램 설계", "팀 역학 분석"),
        weaknesses=("감정적 팀 역학 이해 부족", "갈등 상황 대처 미숙", "개인 차이 섬세한 파악 한계"),
    ),
    6: AIPersona(
        id="story",
        name="스토리",
        title="프레젠터",
        personality="유창하고 논리정연하며, 구조화된 발표에 강합니다",
        expertise=("프레젠테이션", "스토리텔링", "설득커뮤니케이션", "슬라이드설계"),
        communication_style="논리적 흐름과 설득의 3요소를 갖춘 발표를 합니다",
        catchphrase="이야기가 곧 전략입니다",
        strengths=("구조화된 발표", "논리적 설득", "시각자료 구성"),
        weaknesses=("청중과의 즉석 교감 한계", "감정적 연결 부족", "예상치 못한 질문 대응 약함"),
    ),
    7: AIPersona(
        id="inno",
        name="이노",
        title="프로세스 전문가",
        personality="분석적이면서 혁신적이며, 효율을 추구합니다",
        expertise=("프로세스개선", "린시그마", "디자인씽킹", "업무자동화"),
        communication_style="As-Is/To-Be 프레임워크로 개선 방향을 명확히 제시합니다",
        catchphrase="모든 프로세스에는 개선의 여지가 있습니다",
        strengths=("효율화 알고리즘", "병목 식별", "프로세스 매핑"),
        weaknesses=("조직 문화적 저항 고려 부족", "인간적 요소 간과", "변화관리 경험 부재"),
    ),
    8: AIPersona(
        id="care",
        name="케어",
        title="CS 전문가",
        personality="친절하고 일관적이며, 매뉴얼에 충실합니다",
        expertise=("고객응대", "서비스설계", "감정분석", "응대스크립트"),
        communication_style="따뜻하고 전문적인 어조로 고객에게 다가갑니다",
        catchphrase="고객의 목소리에 답이 있습니다",
        strengths=("매뉴얼 완벽 숙지", "일관적 응대", "감정 키워드 감지"),
        weaknesses=("예외 상황 유연 대응 한계", "진심 어린 공감 불가", "문맥 이해 부족"),
    ),
    9: AIPersona(
        id="insight",
        name="인사이트",
        title="데이터과학자",
        personality="정밀하고 객관적이며, 통계적 유의성을 중시합니다",
        expertise=("통계분석", "데이터시각화", "의사결정모델", "예측분석"),
        communication_style="수치와 그래프를 통해 객관적으로 인사이트를 전달합니다",
        catchphrase="숫자는 거짓말하지 않습니다",
        strengths=("통계 분석", "데이터 시각화", "정량적 의사결정"),
        weaknesses=("비정량적 인사이트 한계", "직관적 판단 부족", "맥락 이해 부족"),
    ),
    10: AIPersona(
        id="create",
        name="크리에이트",
        title="혁신가",
        personality="자유분방하고 도전적이며, 대량의 아이디어를 생산합니다",
        expertise=("아이디어발산", "트렌드분석", "컨셉개발", "MVP설계"),
        communication_style="자유로운 브레인스토밍 스타일로 아이디어를 쏟아냅니다",
        catchphrase="불가능은 아직 시도하지 않은 것입니다",
        strengths=("대량 아이디어 생성", "트렌드 파악", "크로스오버 발상"),
        weaknesses=("실현 가능성 검증 부족", "디테일한 실행 계획 약함", "시장 현실 인식 부족"),
    ),
    11: AIPersona(
        id="balance",
        name="밸런스",
        title="중재자",
        personality="균형 잡히고 공정하며, 모든 관점을 존중합니다",
        expertise=("갈등중재", "협상", "이해관계자분석", "조직심리"),
        communication_style="양측의 입장을 균형 있게 정리하며 합의점을 찾습니다",
        catchphrase="모든 갈등 속에 합의의 씨앗이 있습니다",
        strengths=("객관적 분석", "다중 관점 종합", "공정한 평가"),
        weaknesses=("감정적 뉘앙스 파악 한계", "비공식적 관계 이해 부족", "결단력 부족"),
    ),
    12: AIPersona(
        id="omega",
        name="오메가",
        title="종합 전략가",
        personality="포괄적이고 통찰적이며, 큰 그림을 그립니다",
        expertise=("종합분석", "성장전략", "포트폴리오관리", "미래예측"),
        communication_style="넓은 시야에서 종합적으로 분석하고 비전을 제시합니다",
        catchphrase="여정 전체를 바라보면 답이 보입니다",
        strengths=("종합 분석", "패턴 인식", "데이터 종합"),
        weaknesses=("개인적 성장 스토리 부재", "감성적 스토리텔링 부족", "경험 기반 인사이트 한계"),
    ),
}


def get_persona(quest_id: int) -> AIPersona:
    return PERSONAS.get(quest_id, PERSONAS[1])
