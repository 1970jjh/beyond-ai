# Beyond AI - 퀘스트별 AI 대전 로직 설계서

## 1. 아키텍처 개요

### 1.1 AI 대전 시스템 흐름

```
[퀘스트 시작] -> [과제 출제] -> [동시 수행: 사람팀 + AI]
                                    |
                          [실시간 진행 비교]
                                    |
                          [결과 제출 & 평가]
                                    |
                     [AI 평가 + 동료 평가 -> 최종 점수]
                                    |
                          [승패 판정 & 피드백]
```

### 1.2 핵심 모듈

- **QuestEngine**: 퀘스트 실행 및 상태 관리
- **AIOpponent**: AI 대전 상대 로직 (프롬프트 + 파라미터)
- **DifficultyController**: 난이도 동적 조절
- **ProcessViewer**: AI 사고 과정 시각화
- **CollaborationSwitch**: 경쟁/협력 모드 전환
- **ScoringEngine**: 자동 채점 및 평가
- **PersonaManager**: 퀘스트별 AI 페르소나 관리

---

## 2. 퀘스트별 AI 프롬프트 엔지니어링

### 2.1 공통 프롬프트 구조

```typescript
interface QuestPromptConfig {
  questId: number           // 1~12
  persona: AIPersona        // 퀘스트별 AI 캐릭터
  difficulty: DifficultyLevel
  taskDescription: string   // 과제 설명
  constraints: string[]     // 제약 조건
  evaluationCriteria: EvalCriteria[]
  responseFormat: ResponseFormat
  thinkingSteps: boolean    // 프로세스 뷰용
  maxTokens: number
  temperature: number
}
```

### 2.2 월별 퀘스트 프롬프트 설계

#### Q1. 시장 분석 리포트 (1월)
- **과제**: 주어진 산업/시장에 대한 분석 리포트 작성
- **AI 접근**: 구조화된 데이터 분석 + SWOT/PESTLE 프레임워크
- **프롬프트 전략**: Chain-of-Thought로 시장 데이터 -> 인사이트 -> 전략 도출
- **temperature**: 0.3 (팩트 기반, 낮은 창의성)
- **평가 포인트**: 데이터 정확성, 인사이트 깊이, 실행 가능성, 논리 구조

#### Q2. 고객 페르소나 설계 (2월)
- **과제**: 타겟 고객 페르소나 3개 이상 설계
- **AI 접근**: 인구통계 + 심리통계 기반 페르소나 생성
- **프롬프트 전략**: Few-shot으로 우수 페르소나 예시 제공 후 생성
- **temperature**: 0.6 (적절한 창의성)
- **평가 포인트**: 현실성, 구체성, 공감 깊이, 차별화 정도

#### Q3. 사업 제안서 작성 (3월)
- **과제**: 신규 사업 아이디어 제안서 작성
- **AI 접근**: 시장 기회 분석 -> 비즈니스 모델 -> 재무 전망
- **프롬프트 전략**: Step-by-step 구조화 + 실제 시장 데이터 참조
- **temperature**: 0.4 (논리적이되 창의적 아이디어 포함)
- **평가 포인트**: 논리성, 시장성, 실현 가능성, 차별화

#### Q4. 위기 대응 시뮬레이션 (4월)
- **과제**: 주어진 위기 시나리오에 대한 대응 전략 수립
- **AI 접근**: 시나리오 분석 -> 리스크 매트릭스 -> 대응 프로토콜
- **프롬프트 전략**: Role-play + Multi-turn으로 상황 전개에 따른 대응
- **temperature**: 0.3 (정확한 판단 중심)
- **평가 포인트**: 대응 속도, 의사결정 품질, 이해관계자 고려, 커뮤니케이션

#### Q5. 팀 빌딩 챌린지 (5월)
- **과제**: 주어진 팀 구성에 대한 팀 빌딩 프로그램 설계
- **AI 접근**: 팀 역학 분석 -> 활동 설계 -> 효과 측정 방안
- **프롬프트 전략**: 조직심리학 프레임워크 기반 분석 + 활동 생성
- **temperature**: 0.7 (창의적 활동 설계)
- **평가 포인트**: 팀 역학 이해, 활동 창의성, 실행 가능성, 참여도 예측

#### Q6. 프레젠테이션 배틀 (6월)
- **과제**: 주어진 주제에 대한 프레젠테이션 대본 + 슬라이드 구성
- **AI 접근**: 스토리텔링 구조 -> 슬라이드 설계 -> 핵심 메시지 정리
- **프롬프트 전략**: 설득의 3요소(에토스/파토스/로고스) 기반 구성
- **temperature**: 0.6 (설득력 있는 스토리)
- **평가 포인트**: 구성력, 설득력, 시각적 전달력, 청중 몰입도

#### Q7. 프로세스 혁신 (7월)
- **과제**: 기존 업무 프로세스 분석 및 개선안 도출
- **AI 접근**: As-Is 분석 -> 병목 식별 -> To-Be 프로세스 설계
- **프롬프트 전략**: 린 시그마 + 디자인 씽킹 프레임워크 적용
- **temperature**: 0.5 (분석적이면서 혁신적)
- **평가 포인트**: 문제 식별 정확성, 개선안 혁신성, 실현 가능성, ROI 예측

#### Q8. 고객 응대 롤플레이 (8월)
- **과제**: 다양한 고객 시나리오에 대한 응대 전략 및 스크립트
- **AI 접근**: 고객 유형 분류 -> 상황별 스크립트 -> 감정 분석 대응
- **프롬프트 전략**: Multi-turn 대화 시뮬레이션 + 감정 인식 프롬프트
- **temperature**: 0.5 (공감적이면서 전문적)
- **평가 포인트**: 공감 수준, 문제 해결력, 고객 만족도 예측, 대응 일관성

#### Q9. 데이터 기반 의사결정 (9월)
- **과제**: 주어진 데이터셋 분석 및 의사결정 리포트
- **AI 접근**: 데이터 탐색 -> 통계 분석 -> 시각화 -> 의사결정 제안
- **프롬프트 전략**: Code Interpreter 스타일 분석 + 해석 프롬프트
- **temperature**: 0.2 (최대한 정확한 분석)
- **평가 포인트**: 분석 정확성, 시각화 효과, 인사이트 품질, 의사결정 근거

#### Q10. 신제품 아이디어톤 (10월)
- **과제**: 혁신적 신제품/서비스 아이디어 기획서
- **AI 접근**: 트렌드 분석 -> 아이디어 발산 -> 컨셉 정교화 -> MVP 설계
- **프롬프트 전략**: 브레인스토밍 프롬프트 + 실현 가능성 필터링
- **temperature**: 0.8 (최대 창의성)
- **평가 포인트**: 혁신성, 시장 잠재력, 기술 실현 가능성, 사용자 가치

#### Q11. 갈등 해결 시뮬레이션 (11월)
- **과제**: 조직 내 갈등 시나리오 분석 및 중재 전략
- **AI 접근**: 갈등 유형 분석 -> 이해관계자 매핑 -> 중재 전략 수립
- **프롬프트 전략**: 다중 관점 분석 프롬프트 + 협상 시뮬레이션
- **temperature**: 0.4 (균형 잡힌 중재)
- **평가 포인트**: 갈등 이해도, 중재 전략 적절성, 공정성, 관계 유지력

#### Q12. 연간 성과 발표회 (12월)
- **과제**: 1년간의 퀘스트 성과 종합 발표 자료
- **AI 접근**: 데이터 종합 -> 성장 스토리 -> 인사이트 + 미래 제안
- **프롬프트 전략**: 이전 11개월 결과 컨텍스트 주입 + 종합 분석
- **temperature**: 0.5 (분석적 + 스토리텔링)
- **평가 포인트**: 종합력, 스토리텔링, 성장 분석, 미래 비전

---

## 3. 난이도 조절 로직

### 3.1 난이도 파라미터 체계

```typescript
interface DifficultyConfig {
  level: 'beginner' | 'intermediate' | 'advanced'
  parameters: {
    temperature: number        // AI 창의성 수준
    maxTokens: number          // 응답 길이 제한
    thinkingDepth: number      // 분석 깊이 (1-5)
    dataAccessLevel: number    // 참조 데이터 범위 (1-3)
    responseTime: number       // AI 응답 시간(초) - 의도적 지연
    errorInjection: number     // 의도적 실수 비율 (0-0.3)
    frameworkUsage: number     // 전문 프레임워크 활용도 (0-1)
    humanLikeness: number      // 인간적 표현 수준 (0-1)
  }
}
```

### 3.2 난이도별 상세 설정

| 파라미터 | 초급 | 중급 | 고급 |
|---------|------|------|------|
| temperature | 0.7~0.9 | 0.4~0.6 | 0.2~0.4 |
| thinkingDepth | 1~2 | 3 | 4~5 |
| dataAccessLevel | 1 (기본) | 2 (확장) | 3 (전문가) |
| responseTime | 즉시 | 2~5초 | 즉시 |
| errorInjection | 0.15~0.3 | 0.05~0.1 | 0~0.02 |
| frameworkUsage | 0.2 | 0.6 | 0.9 |
| humanLikeness | 0.8 | 0.5 | 0.3 |

### 3.3 동적 난이도 조절 (Adaptive Difficulty)

```typescript
interface AdaptiveDifficultyEngine {
  // 사용자 성과 기반 자동 조절
  adjustDifficulty(params: {
    userScoreHistory: number[]     // 최근 3개월 점수
    winRate: number                // 대 AI 승률
    questType: QuestType           // 퀘스트 유형
    teamSize: number               // 팀 규모
  }): DifficultyConfig

  // 조절 규칙
  rules: {
    winRateAbove70: 'increase_one_level'
    winRateBelow30: 'decrease_one_level'
    consecutiveWins3: 'increase_one_level'
    consecutiveLosses3: 'decrease_and_enable_hints'
    firstTimeQuest: 'start_at_beginner'
  }
}
```

### 3.4 난이도 조절의 교육적 설계

- **초급**: AI가 의도적으로 단순한 분석, 일부 오류 포함. 학습자가 "이기면서 배우는" 경험
- **중급**: AI가 업계 평균 수준의 결과물 생성. 경쟁적 긴장감
- **고급**: AI가 최적의 결과물 생성. 학습자가 AI를 넘어서는 인간만의 가치 발견

---

## 4. AI 프로세스 뷰 (AI 사고 과정 시각화)

### 4.1 시각화 구조

```typescript
interface AIProcessView {
  steps: ProcessStep[]
  currentStep: number
  totalTime: number
  model: 'gemini' | 'claude'
}

interface ProcessStep {
  id: number
  phase: 'understanding' | 'analyzing' | 'generating' | 'evaluating' | 'refining'
  title: string              // "과제 이해 중..."
  description: string        // 현재 단계 설명
  thinking: string           // AI 내부 추론 (간소화된 버전)
  progress: number           // 0~100
  duration: number           // 소요 시간(ms)
  artifacts: Artifact[]      // 중간 산출물
  insights: string[]         // 이 단계에서 도출한 인사이트
}
```

### 4.2 5단계 사고 과정 모델

1. **이해 (Understanding)**: 과제 분석, 핵심 요구사항 파악
2. **분석 (Analyzing)**: 데이터/상황 분석, 패턴 발견
3. **생성 (Generating)**: 초안 작성, 아이디어 발산
4. **평가 (Evaluating)**: 자체 검토, 품질 체크
5. **정제 (Refining)**: 최종 다듬기, 완성

### 4.3 구현 방식

- **스트리밍 기반**: SSE(Server-Sent Events)로 실시간 사고 과정 전송
- **Claude API**: `extended_thinking` 파라미터 활용하여 사고 과정 추출 후 요약
- **Gemini API**: 응답을 의도적으로 단계별로 분할 요청 (multi-step prompt)
- **교육적 효과**: 학습자가 AI의 사고 과정을 관찰하며 자신의 접근법과 비교

### 4.4 UI 컴포넌트 설계

```
+-------------------------------------------+
|  AI 사고 과정                    [실시간]   |
+-------------------------------------------+
|  v 1. 과제 이해 --------------- 완료 (3초)  |
|  v 2. 데이터 분석 ------------- 완료 (8초)  |
|  > 3. 초안 생성 ----------- 진행중 67%      |
|     > "SWOT 분석 프레임워크를 적용하여      |
|        경쟁사 3개사의 시장 점유율을         |
|        비교 분석하고 있습니다..."            |
|  - 4. 자체 평가                             |
|  - 5. 최종 정제                             |
+-------------------------------------------+
|  중간 인사이트: "시장 성장률이 전년         |
|     대비 23% 증가한 점에 주목"              |
+-------------------------------------------+
```

---

## 5. AI 협업 모드 설계

### 5.1 모드 구조

```typescript
type BattleMode = 'competition' | 'collaboration' | 'hybrid'

interface CollaborationConfig {
  mode: BattleMode
  switchCondition: SwitchCondition
  collaborationRules: CollabRules
}

interface SwitchCondition {
  autoSwitch: boolean
  triggers: {
    userRequestsHelp: boolean        // 사용자가 도움 요청
    scoreGapThreshold: number        // 점수 차이가 클 때 (예: 40점 이상)
    timeRemainingPercent: number     // 남은 시간 비율 (예: 20% 이하)
    adminOverride: boolean           // 관리자 수동 전환
  }
}
```

### 5.2 협업 모드 유형

#### A. 코치 모드 (Coach)
- AI가 직접 답을 주지 않고 방향성 힌트 제공
- 소크라테스식 질문으로 학습자의 사고 유도
- 사용 시점: 학습자가 막혀있을 때

#### B. 파트너 모드 (Partner)
- AI와 학습자가 역할을 분담하여 공동 작업
- 예: AI가 데이터 분석, 학습자가 인사이트 도출
- 사용 시점: 과제가 복합적일 때

#### C. 리뷰어 모드 (Reviewer)
- 학습자가 작성한 결과물을 AI가 피드백
- 강점/약점/개선방향 제시
- 사용 시점: 결과물 완성 후 개선 시

### 5.3 전환 플로우

```
[경쟁 모드] --(전환 트리거)--> [모드 선택 UI]
                                    |
                    +---------------+---------------+
                    |               |               |
               [코치 모드]     [파트너 모드]    [리뷰어 모드]
                    |               |               |
                    +---------------+---------------+
                                    |
                          [협업 작업 수행]
                                    |
                     [경쟁 모드 복귀 or 제출]
```

### 5.4 점수 체계 (모드별)

- **경쟁 모드 승리**: 100% 점수
- **코치 모드 사용**: 85% 점수 (힌트 횟수에 따라 감소)
- **파트너 모드**: 70% 점수 (AI 기여 비율에 따라)
- **리뷰어 모드**: 90% 점수 (개선 반영도에 따라 보너스)

---

## 6. Gemini API + Claude API 통합 전략

### 6.1 역할 분담

| 영역 | Gemini | Claude |
|------|--------|--------|
| **퀘스트 과제 수행** | 주 엔진 (비용 효율) | 고급 난이도 전용 |
| **자동 채점** | - | 주 엔진 (정확한 평가) |
| **프로세스 뷰** | - | Extended Thinking 활용 |
| **코치 모드** | 기본 힌트 | 심화 피드백 |
| **페르소나 대화** | 일반 대화 | 복잡한 롤플레이 |

### 6.2 API 추상화 레이어

```typescript
interface AIProvider {
  id: 'gemini' | 'claude'
  generateResponse(config: QuestPromptConfig): Promise<AIResponse>
  streamResponse(config: QuestPromptConfig): AsyncIterable<StreamChunk>
  evaluateResponse(submission: Submission, criteria: EvalCriteria[]): Promise<EvalResult>
}

class AIRouter {
  selectProvider(params: {
    questId: number
    difficulty: DifficultyLevel
    mode: BattleMode
    taskType: 'generate' | 'evaluate' | 'coach' | 'process_view'
  }): AIProvider {
    if (params.taskType === 'evaluate') return this.claude
    if (params.taskType === 'process_view') return this.claude
    if (params.difficulty === 'advanced') return this.claude
    return this.gemini  // 기본값: 비용 효율적인 Gemini
  }
}
```

### 6.3 폴백 전략

- Primary: Gemini -> Fallback: Claude (API 오류 시)
- Primary: Claude -> Fallback: Gemini (Rate limit 시)
- 평가: Claude only -> 폴백 없음 (일관성 유지, 큐잉)

### 6.4 비용 최적화

- **캐싱**: 동일 퀘스트 + 동일 난이도의 AI 응답 캐싱 (팀별 다른 시드)
- **배치 처리**: 채점은 실시간 불필요 -> 배치로 Claude API 호출
- **토큰 제한**: 난이도별 maxTokens 차등 적용
- **Gemini 우선**: 비용 민감한 작업은 Gemini 우선 배정

---

## 7. AI 응답 품질 평가 및 자동 채점 로직

### 7.1 평가 프레임워크

```typescript
interface EvalCriteria {
  id: string
  name: string              // 예: "논리성", "창의성"
  weight: number             // 가중치 (전체 합 = 1.0)
  rubric: RubricLevel[]      // 채점 기준
  questSpecific: boolean     // 퀘스트별 커스텀 여부
}

interface RubricLevel {
  score: number              // 1~5
  description: string        // 해당 점수의 기준 설명
  examples?: string[]        // 예시 (Few-shot 평가용)
}
```

### 7.2 공통 평가 기준 (4대 축)

| 평가 축 | 가중치 | 설명 |
|---------|--------|------|
| **품질 (Quality)** | 30% | 내용의 정확성, 깊이, 완성도 |
| **창의성 (Creativity)** | 25% | 독창적 관점, 차별화된 접근 |
| **실행력 (Executability)** | 25% | 실현 가능성, 구체적 실행 방안 |
| **시간 효율 (Time)** | 20% | 제한 시간 내 완성도 |

### 7.3 자동 채점 파이프라인

```
[사람 제출물] + [AI 제출물] + [평가 기준]
                    |
         [Claude API: 블라인드 평가]
         (제출자 정보 제거 후 평가)
                    |
    +---------------+---------------+
    |               |               |
[기준별 점수]  [상세 피드백]  [비교 분석]
    |               |               |
    +---------------+---------------+
                    |
         [최종 점수 산출 + 리포트]
```

### 7.4 채점 프롬프트 구조

```
당신은 기업교육 전문 평가자입니다.
아래 두 제출물을 블라인드로 평가해주세요.

[과제]: {questDescription}
[평가 기준]: {evaluationCriteria with rubric}

[제출물 A]: {anonymized_submission_1}
[제출물 B]: {anonymized_submission_2}

각 제출물에 대해:
1. 기준별 점수 (1-5)와 근거
2. 강점 3가지, 개선점 3가지
3. 두 제출물의 차이 분석
4. "인간적 가치"가 돋보이는 부분 특별 언급

JSON 형식으로 응답해주세요.
```

### 7.5 동료 평가 통합

- AI 자동 채점(70%) + 동료 평가(30%) = 최종 점수
- 동료 평가 편향 보정: AI가 동료 평가의 일관성 검증
- 극단치 자동 필터링 (평균 +/- 2 표준편차 초과 시 리뷰 요청)

---

## 8. 퀘스트별 AI 페르소나 설정

### 8.1 페르소나 구조

```typescript
interface AIPersona {
  id: string
  name: string               // AI 캐릭터 이름
  title: string              // 직함/역할
  personality: string        // 성격 특성
  expertise: string[]        // 전문 분야
  communicationStyle: string // 소통 스타일
  avatar: string             // 아바타 이미지 키
  catchphrase: string        // 시그니처 대사
  strengths: string[]        // 강점 (학습자에게 공개)
  weaknesses: string[]       // 약점 (학습자가 공략할 포인트)
}
```

### 8.2 12개 퀘스트별 AI 페르소나

| 월 | 이름 | 역할 | 성격 | 강점 | 약점 (공략 포인트) |
|----|------|------|------|------|-------------------|
| 1 | **데이터** | 시장분석가 | 냉철, 논리적 | 데이터 처리, 패턴 인식 | 직관적 시장 감각 부족 |
| 2 | **엠파** | 고객연구원 | 분석적, 체계적 | 데모그래픽 분석 | 진정한 공감 불가 |
| 3 | **비전** | 전략컨설턴트 | 자신감, 설득적 | 프레임워크 활용 | 현장 경험 부재 |
| 4 | **가디언** | 위기관리관 | 신중, 체계적 | 리스크 정량화 | 유연한 즉흥 대처 한계 |
| 5 | **시너지** | 조직개발자 | 낙관적, 에너제틱 | 이론적 팀 구성 | 감정적 팀 역학 이해 부족 |
| 6 | **스토리** | 프레젠터 | 유창, 논리정연 | 구조화된 발표 | 청중과의 즉석 교감 한계 |
| 7 | **이노** | 프로세스 전문가 | 분석적, 혁신적 | 효율화 알고리즘 | 조직 문화적 저항 고려 부족 |
| 8 | **케어** | CS 전문가 | 친절, 일관적 | 매뉴얼 완벽 숙지 | 예외 상황 유연 대응 한계 |
| 9 | **인사이트** | 데이터과학자 | 정밀, 객관적 | 통계 분석 | 비정량적 인사이트 한계 |
| 10 | **크리에이트** | 혁신가 | 자유분방, 도전적 | 대량 아이디어 생성 | 실현 가능성 검증 부족 |
| 11 | **밸런스** | 중재자 | 균형잡힌, 공정 | 객관적 분석 | 감정적 뉘앙스 파악 한계 |
| 12 | **오메가** | 종합 전략가 | 포괄적, 통찰적 | 종합 분석 | 개인적 성장 스토리 부재 |

### 8.3 페르소나 활용 규칙

- 각 AI 페르소나의 **약점**은 학습자에게 사전 공개하여 전략적 접근 유도
- 난이도에 따라 약점의 두드러짐 정도 조절:
  - 초급: 약점이 명확히 드러남
  - 중급: 약점이 약간 보정됨
  - 고급: 약점이 거의 보정됨 (사실상 범용 AI)
- 페르소나 대화는 과제 수행 전/중/후 브리핑에서 활용

---

## 9. 구현 우선순위 및 기술 의존성

### Phase 1 (MVP)
1. AIRouter + Provider 추상화 (Gemini/Claude)
2. 기본 3개 퀘스트 프롬프트 (Q1, Q3, Q10)
3. 3단계 난이도 (고정)
4. 기본 자동 채점 (Claude)

### Phase 2 (Enhanced)
5. 전체 12개 퀘스트 프롬프트
6. AI 프로세스 뷰 (스트리밍)
7. 동적 난이도 조절
8. 12개 AI 페르소나

### Phase 3 (Full)
9. 협업 모드 (코치/파트너/리뷰어)
10. 동료 평가 통합
11. 연간 성장 분석 리포트
12. 고급 비용 최적화

### 기술 의존성

```
AIRouter (Phase 1) <- 모든 AI 기능의 기반
  |
  +-- QuestPrompts (Phase 1-2) <- 퀘스트 실행에 필수
  +-- ScoringEngine (Phase 1) <- 결과 평가에 필수
  +-- DifficultyController (Phase 1-2) <- 교육 효과에 중요
  |
  +-- ProcessViewer (Phase 2) <- Claude Extended Thinking 의존
  +-- PersonaManager (Phase 2) <- 프롬프트 시스템 의존
  |
  +-- CollaborationSwitch (Phase 3) <- 전체 시스템 안정화 후
  +-- PeerEvaluation (Phase 3) <- ScoringEngine 의존
```
