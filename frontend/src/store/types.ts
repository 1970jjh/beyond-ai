export interface AppUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: 'learner' | 'admin'
  readonly teamId: string | null
  readonly roomCode: string | null
  readonly totalScore: number
  readonly badges: ReadonlyArray<string>
}

export interface GameRoom {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly hostId: string
  readonly hostName: string
  readonly activeQuestId: string | null
  readonly status: 'waiting' | 'in_progress' | 'completed'
  readonly participants: ReadonlyArray<RoomParticipant>
  readonly createdAt: string
  readonly maxParticipants: number
}

export interface RoomParticipant {
  readonly userId: string
  readonly name: string
  readonly role: 'learner' | 'admin'
  readonly joinedAt: string
  readonly isReady: boolean
}

export interface BattleSession {
  readonly id: string
  readonly questId: string
  readonly roomId: string
  readonly status: 'preparing' | 'countdown' | 'in_progress' | 'evaluating' | 'completed'
  readonly startedAt: string | null
  readonly endedAt: string | null
  readonly timeLimit: number
  readonly timeRemaining: number
  readonly humanSubmission: string
  readonly aiSubmission: string
  readonly aiProgress: number
  readonly aiSteps: ReadonlyArray<AiStep>
  readonly scores: BattleScoreBreakdown | null
  readonly winner: 'human' | 'ai' | 'draw' | null
}

export interface AiStep {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly status: 'pending' | 'active' | 'done'
  readonly output: string | null
}

export interface BattleScoreBreakdown {
  readonly quality: { human: number; ai: number }
  readonly creativity: { human: number; ai: number }
  readonly execution: { human: number; ai: number }
  readonly efficiency: { human: number; ai: number }
  readonly totalHuman: number
  readonly totalAi: number
}

export interface QuestResult {
  readonly questId: string
  readonly month: number
  readonly title: string
  readonly humanScore: number
  readonly aiScore: number
  readonly winner: 'human' | 'ai' | 'draw'
  readonly completedAt: string
  readonly badges: ReadonlyArray<string>
}
