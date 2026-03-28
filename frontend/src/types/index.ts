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

export type UserRole = 'learner' | 'admin' | 'facilitator'

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
