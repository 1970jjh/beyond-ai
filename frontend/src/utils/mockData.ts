import type { Quest, BattleState, AiProcessStep, Badge, DashboardStats } from '../types'

export const QUESTS: ReadonlyArray<Quest> = [
  { id: 'q1', month: 1, title: '시장 분석 리포트', description: '주어진 산업의 시장 현황을 분석하고 인사이트를 도출하라', coreSkill: '데이터 분석', status: 'completed', difficulty: 'intermediate', humanScore: 82, aiScore: 78, startDate: '2026-01-01', endDate: '2026-01-31' },
  { id: 'q2', month: 2, title: '고객 페르소나 설계', description: '타겟 고객의 행동 패턴과 니즈를 파악하여 페르소나를 구축하라', coreSkill: '고객 이해', status: 'completed', difficulty: 'beginner', humanScore: 75, aiScore: 80, startDate: '2026-02-01', endDate: '2026-02-28' },
  { id: 'q3', month: 3, title: '사업 제안서 작성', description: '신규 사업 기회를 발굴하고 설득력 있는 제안서를 작성하라', coreSkill: '기획력', status: 'active', difficulty: 'advanced', humanScore: null, aiScore: null, startDate: '2026-03-01', endDate: '2026-03-31' },
  { id: 'q4', month: 4, title: '위기 대응 시뮬레이션', description: '예상치 못한 위기 상황에서 최적의 대응 전략을 수립하라', coreSkill: '문제 해결', status: 'upcoming', difficulty: 'advanced', humanScore: null, aiScore: null, startDate: '2026-04-01', endDate: '2026-04-30' },
  { id: 'q5', month: 5, title: '팀 빌딩 챌린지', description: '다양한 배경의 팀원들과 협력하여 공동 목표를 달성하라', coreSkill: '리더십', status: 'locked', difficulty: 'intermediate', humanScore: null, aiScore: null, startDate: '2026-05-01', endDate: '2026-05-31' },
  { id: 'q6', month: 6, title: '프레젠테이션 배틀', description: '동일한 주제로 청중을 설득하는 프레젠테이션을 준비하라', coreSkill: '커뮤니케이션', status: 'locked', difficulty: 'intermediate', humanScore: null, aiScore: null, startDate: '2026-06-01', endDate: '2026-06-30' },
  { id: 'q7', month: 7, title: '프로세스 혁신', description: '기존 업무 프로세스를 분석하고 혁신적인 개선안을 제시하라', coreSkill: '창의적 사고', status: 'locked', difficulty: 'advanced', humanScore: null, aiScore: null, startDate: '2026-07-01', endDate: '2026-07-31' },
  { id: 'q8', month: 8, title: '고객 응대 롤플레이', description: '까다로운 고객 상황을 시뮬레이션하고 최선의 응대를 보여라', coreSkill: '서비스 마인드', status: 'locked', difficulty: 'beginner', humanScore: null, aiScore: null, startDate: '2026-08-01', endDate: '2026-08-31' },
  { id: 'q9', month: 9, title: '데이터 기반 의사결정', description: '복잡한 데이터를 분석하여 최적의 비즈니스 의사결정을 내려라', coreSkill: '분석력', status: 'locked', difficulty: 'advanced', humanScore: null, aiScore: null, startDate: '2026-09-01', endDate: '2026-09-30' },
  { id: 'q10', month: 10, title: '신제품 아이디어톤', description: '시장 니즈를 파악하고 혁신적인 제품/서비스를 기획하라', coreSkill: '혁신', status: 'locked', difficulty: 'intermediate', humanScore: null, aiScore: null, startDate: '2026-10-01', endDate: '2026-10-31' },
  { id: 'q11', month: 11, title: '갈등 해결 시뮬레이션', description: '조직 내 갈등 상황을 중재하고 합의점을 도출하라', coreSkill: '갈등 관리', status: 'locked', difficulty: 'advanced', humanScore: null, aiScore: null, startDate: '2026-11-01', endDate: '2026-11-30' },
  { id: 'q12', month: 12, title: '연간 성과 발표회', description: '1년간의 여정을 정리하고 성장 스토리를 발표하라', coreSkill: '종합 역량', status: 'locked', difficulty: 'advanced', humanScore: null, aiScore: null, startDate: '2026-12-01', endDate: '2026-12-31' },
]

export const MOCK_BATTLE: BattleState = {
  questId: 'q3',
  humanProgress: 65,
  aiProgress: 78,
  humanSubmission: null,
  aiSubmission: null,
  timeRemaining: 2340,
  result: 'in_progress',
  scores: {
    quality: { human: 72, ai: 68 },
    creativity: { human: 85, ai: 60 },
    execution: { human: 58, ai: 82 },
    efficiency: { human: 45, ai: 90 },
  },
}

export const MOCK_AI_STEPS: ReadonlyArray<AiProcessStep> = [
  { id: 's1', label: '과제 분석', description: '사업 제안서의 핵심 요구사항을 파악합니다', status: 'done', output: '핵심 요구사항: 시장 분석, 경쟁 우위, 재무 계획, 실행 전략', timestamp: '2026-03-28T10:00:00Z' },
  { id: 's2', label: '데이터 수집', description: '관련 시장 데이터와 트렌드를 수집합니다', status: 'done', output: '수집 완료: 시장 규모 데이터, 경쟁사 분석, 소비자 트렌드 3건', timestamp: '2026-03-28T10:05:00Z' },
  { id: 's3', label: '구조 설계', description: '제안서의 논리적 구조를 설계합니다', status: 'active', output: null, timestamp: '2026-03-28T10:10:00Z' },
  { id: 's4', label: '초안 작성', description: '수집된 데이터를 기반으로 제안서를 작성합니다', status: 'pending', output: null, timestamp: '2026-03-28T10:15:00Z' },
  { id: 's5', label: '검토 및 최적화', description: '작성된 제안서를 검토하고 품질을 높입니다', status: 'pending', output: null, timestamp: '2026-03-28T10:20:00Z' },
]

export const MOCK_BADGES: ReadonlyArray<Badge> = [
  { id: 'b1', name: 'AI 헌터', description: 'AI를 처음으로 이겼습니다', icon: '🎯', earnedAt: '2026-01-31', tier: 'bronze' },
  { id: 'b2', name: '분석의 달인', description: '데이터 분석 퀘스트에서 80점 이상 획득', icon: '📊', earnedAt: '2026-01-31', tier: 'silver' },
  { id: 'b3', name: '연속 승리', description: '2회 연속 AI를 이겼습니다', icon: '🔥', earnedAt: '2026-02-28', tier: 'gold' },
]

export const MOCK_DASHBOARD: DashboardStats = {
  totalQuests: 12,
  completedQuests: 2,
  humanWins: 1,
  aiWins: 1,
  draws: 0,
  averageHumanScore: 78.5,
  averageAiScore: 79,
  topPerformers: [
    { userId: 'u1', name: '김민수', score: 165 },
    { userId: 'u2', name: '이지은', score: 158 },
    { userId: 'u3', name: '박준호', score: 152 },
  ],
}
