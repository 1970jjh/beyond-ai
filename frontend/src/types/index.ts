export interface Quest {
  readonly id: string
  readonly month: number
  readonly title: string
  readonly description: string
  readonly coreSkill: string
  readonly status: QuestStatus
  readonly difficulty: Difficulty
  readonly humanScore: number | null
  readonly aiScore: number | null
  readonly startDate: string
  readonly endDate: string
}

export type QuestStatus = 'locked' | 'active' | 'completed' | 'upcoming'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type BattleResult = 'human_win' | 'ai_win' | 'draw' | 'in_progress'

export interface BattleState {
  readonly questId: string
  readonly humanProgress: number
  readonly aiProgress: number
  readonly humanSubmission: string | null
  readonly aiSubmission: string | null
  readonly timeRemaining: number
  readonly result: BattleResult
  readonly scores: BattleScores
}

export interface BattleScores {
  readonly quality: { human: number; ai: number }
  readonly creativity: { human: number; ai: number }
  readonly execution: { human: number; ai: number }
  readonly efficiency: { human: number; ai: number }
}

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly teamId: string | null
  readonly badges: ReadonlyArray<Badge>
  readonly title: string
  readonly totalScore: number
  readonly monthlyScores: ReadonlyArray<MonthlyScore>
}

export type UserRole = 'learner' | 'admin'

export interface Badge {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly earnedAt: string
  readonly tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface MonthlyScore {
  readonly month: number
  readonly humanScore: number
  readonly aiScore: number
  readonly result: BattleResult
}

export interface TeamRanking {
  readonly teamId: string
  readonly teamName: string
  readonly rank: number
  readonly totalScore: number
  readonly winsAgainstAi: number
  readonly members: ReadonlyArray<string>
}

export interface AiProcessStep {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly status: 'pending' | 'active' | 'done'
  readonly output: string | null
  readonly timestamp: string
}

export interface DashboardStats {
  readonly totalQuests: number
  readonly completedQuests: number
  readonly humanWins: number
  readonly aiWins: number
  readonly draws: number
  readonly averageHumanScore: number
  readonly averageAiScore: number
  readonly topPerformers: ReadonlyArray<{ userId: string; name: string; score: number }>
}

export interface Room {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly teamCount: number
  readonly maxMembersPerTeam: number
  readonly questId: string
  readonly status: 'waiting' | 'in_progress' | 'completed'
  readonly createdAt: string
  readonly participants: number
}

export interface Team {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly members: ReadonlyArray<TeamMember>
}

export interface TeamMember {
  readonly userId: string
  readonly name: string
  readonly role: 'leader' | 'researcher' | 'presenter' | 'analyst'
  readonly avatar: string
}

export type TeamRole = TeamMember['role']

export interface BattlePrep {
  readonly questId: string
  readonly questTitle: string
  readonly humanTeam: Team
  readonly aiModel: string
  readonly timeLimit: number
  readonly criteria: ReadonlyArray<string>
}

export interface BattleResultData {
  readonly questId: string
  readonly humanScore: number
  readonly aiScore: number
  readonly winner: 'human' | 'ai' | 'draw'
  readonly breakdown: BattleScores
  readonly humanSubmission: string
  readonly aiSubmission: string
  readonly badges: ReadonlyArray<Badge>
  readonly xpGained: number
}

export interface AnalysisData {
  readonly monthlyScores: ReadonlyArray<MonthlyScore>
  readonly skillRadar: ReadonlyArray<{ skill: string; human: number; ai: number }>
  readonly growthRate: number
  readonly totalBadges: number
  readonly streakDays: number
  readonly bestCategory: string
}

export interface SuddenEvent {
  readonly id: string
  readonly type: 'bonus_time' | 'score_multiplier' | 'swap_roles' | 'mystery_challenge' | 'speed_round'
  readonly title: string
  readonly description: string
  readonly duration: number
  readonly multiplier?: number
  readonly icon: string
}

export interface FinalReport {
  readonly userId: string
  readonly userName: string
  readonly totalScore: number
  readonly rank: number
  readonly totalParticipants: number
  readonly questResults: ReadonlyArray<{
    month: number
    title: string
    humanScore: number
    aiScore: number
    result: BattleResult
  }>
  readonly badges: ReadonlyArray<Badge>
  readonly growthPercentage: number
  readonly topSkill: string
  readonly bestMonth: number
}
