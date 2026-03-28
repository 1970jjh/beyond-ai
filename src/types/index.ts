export interface Quest {
  readonly id: number
  readonly month: number
  readonly title: string
  readonly skill: string
  readonly description: string
  readonly icon: string
  readonly color: string
}

export interface BattleState {
  readonly questId: number
  readonly phase: 'ready' | 'human-working' | 'ai-working' | 'comparing' | 'result'
  readonly humanScore: number
  readonly aiScore: number
  readonly timeLeft: number
}

export interface TeamScore {
  readonly teamName: string
  readonly wins: number
  readonly losses: number
  readonly draws: number
  readonly totalScore: number
}

export interface MonthlyResult {
  readonly month: number
  readonly questId: number
  readonly humanScore: number
  readonly aiScore: number
  readonly winner: 'human' | 'ai' | 'draw'
}
