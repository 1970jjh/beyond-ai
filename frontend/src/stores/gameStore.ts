import { create } from 'zustand'
import type { Quest, BattleState, BattleResult, AiProcessStep } from '../types'
import { QUESTS, MOCK_BATTLE, MOCK_AI_STEPS } from '../utils/mockData'

export type GameEvent = {
  readonly id: string
  readonly type: 'sudden_quest' | 'time_bonus' | 'score_boost' | 'team_swap' |
    'ai_upgrade' | 'hint_drop' | 'freeze' | 'double_points' | 'wildcard' | 'boss_raid'
  readonly title: string
  readonly description: string
  readonly duration: number
  readonly isActive: boolean
}

interface GameState {
  readonly quests: ReadonlyArray<Quest>
  readonly currentQuest: Quest | null
  readonly currentQuestIndex: number
  readonly battle: BattleState | null
  readonly aiSteps: ReadonlyArray<AiProcessStep>
  readonly activeEvent: GameEvent | null
  readonly helpCount: number
  readonly maxHelps: number
  readonly timerSeconds: number
  readonly timerRunning: boolean
  readonly timerPaused: boolean
  readonly isFullscreen: boolean
}

interface GameActions {
  setCurrentQuest: (index: number) => void
  startBattle: () => void
  updateBattle: (updates: Partial<BattleState>) => void
  endBattle: (result: BattleResult) => void
  triggerEvent: (event: GameEvent) => void
  clearEvent: () => void
  useHelp: () => boolean
  startTimer: (seconds: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  tickTimer: () => void
  toggleFullscreen: () => void
  nextQuest: () => void
}

type GameStore = GameState & GameActions

export const SUDDEN_EVENTS: ReadonlyArray<GameEvent> = [
  { id: 'e1', type: 'sudden_quest', title: '긴급 미션!', description: '30초 안에 핵심 키워드 3개를 작성하세요', duration: 30, isActive: false },
  { id: 'e2', type: 'time_bonus', title: '시간 보너스', description: '추가 5분이 주어집니다!', duration: 5, isActive: false },
  { id: 'e3', type: 'score_boost', title: '점수 2배!', description: '다음 1분간 획득 점수가 2배입니다', duration: 60, isActive: false },
  { id: 'e4', type: 'team_swap', title: '팀 셔플!', description: '팀원 1명이 랜덤으로 교체됩니다', duration: 10, isActive: false },
  { id: 'e5', type: 'ai_upgrade', title: 'AI 강화!', description: 'AI의 난이도가 한 단계 상승합니다', duration: 0, isActive: false },
  { id: 'e6', type: 'hint_drop', title: '힌트 드롭', description: '모든 팀에게 힌트가 제공됩니다', duration: 0, isActive: false },
  { id: 'e7', type: 'freeze', title: '프리즈!', description: '30초간 AI의 진행이 멈춥니다', duration: 30, isActive: false },
  { id: 'e8', type: 'double_points', title: '더블 포인트', description: '이번 라운드 점수가 2배로 적용됩니다', duration: 0, isActive: false },
  { id: 'e9', type: 'wildcard', title: '와일드카드', description: '팀이 원하는 도구를 하나 선택할 수 있습니다', duration: 60, isActive: false },
  { id: 'e10', type: 'boss_raid', title: '보스 레이드!', description: '모든 팀이 협력하여 강화된 AI에 도전합니다', duration: 120, isActive: false },
]

export const useGameStore = create<GameStore>((set, get) => ({
  quests: QUESTS,
  currentQuest: null,
  currentQuestIndex: -1,
  battle: null,
  aiSteps: MOCK_AI_STEPS,
  activeEvent: null,
  helpCount: 0,
  maxHelps: 3,
  timerSeconds: 0,
  timerRunning: false,
  timerPaused: false,
  isFullscreen: false,

  setCurrentQuest: (index) => {
    const quest = QUESTS[index]
    if (quest) {
      set({ currentQuest: quest, currentQuestIndex: index })
    }
  },

  startBattle: () => {
    set({
      battle: { ...MOCK_BATTLE, timeRemaining: 2400, result: 'in_progress' },
      aiSteps: MOCK_AI_STEPS.map((s) => ({ ...s, status: 'pending' as const })),
    })
  },

  updateBattle: (updates) => {
    const battle = get().battle
    if (!battle) return
    set({ battle: { ...battle, ...updates } })
  },

  endBattle: (result) => {
    const battle = get().battle
    if (!battle) return
    set({ battle: { ...battle, result, timeRemaining: 0 } })
  },

  triggerEvent: (event) => {
    set({ activeEvent: { ...event, isActive: true } })
  },

  clearEvent: () => set({ activeEvent: null }),

  useHelp: () => {
    const { helpCount, maxHelps } = get()
    if (helpCount >= maxHelps) return false
    set({ helpCount: helpCount + 1 })
    return true
  },

  startTimer: (seconds) => set({ timerSeconds: seconds, timerRunning: true, timerPaused: false }),
  pauseTimer: () => set({ timerPaused: true }),
  resumeTimer: () => set({ timerPaused: false }),
  stopTimer: () => set({ timerSeconds: 0, timerRunning: false, timerPaused: false }),

  tickTimer: () => {
    const { timerSeconds, timerRunning, timerPaused } = get()
    if (!timerRunning || timerPaused || timerSeconds <= 0) return
    set({ timerSeconds: timerSeconds - 1 })
    if (timerSeconds - 1 <= 0) {
      set({ timerRunning: false })
    }
  },

  toggleFullscreen: () => {
    const { isFullscreen } = get()
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    set({ isFullscreen: !isFullscreen })
  },

  nextQuest: () => {
    const { currentQuestIndex } = get()
    const nextIndex = currentQuestIndex + 1
    if (nextIndex < QUESTS.length) {
      set({
        currentQuest: QUESTS[nextIndex],
        currentQuestIndex: nextIndex,
        battle: null,
        helpCount: 0,
      })
    }
  },
}))
