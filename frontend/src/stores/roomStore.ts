import { create } from 'zustand'

export interface Team {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly members: ReadonlyArray<TeamMember>
  readonly score: number
}

export interface TeamMember {
  readonly id: string
  readonly name: string
  readonly role: string | null
  readonly isOnline: boolean
}

export interface Room {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly industryType: string
  readonly teamCount: number
  readonly maxMembersPerTeam: number
  readonly teams: ReadonlyArray<Team>
  readonly status: 'waiting' | 'active' | 'paused' | 'finished'
  readonly currentQuest: number
  readonly createdAt: string
}

interface RoomState {
  readonly currentRoom: Room | null
  readonly myTeam: Team | null
  readonly myRole: string | null
  readonly isLoading: boolean
  readonly error: string | null
}

interface RoomActions {
  createRoom: (params: {
    name: string
    industryType: string
    teamCount: number
    maxMembersPerTeam: number
  }) => Promise<Room | null>
  joinRoom: (code: string) => Promise<boolean>
  joinTeam: (teamId: string, role: string) => Promise<boolean>
  setRoom: (room: Room) => void
  setMyTeam: (team: Team) => void
  leaveRoom: () => void
  updateRoom: (updates: Partial<Room>) => void
  updateTeam: (teamId: string, updates: Partial<Team>) => void
}

type RoomStore = RoomState & RoomActions

const TEAM_COLORS = [
  '#0055FF', '#FF3333', '#00CC66', '#8B5CF6',
  '#FF6600', '#FF00AA', '#00CCCC', '#FFE500',
]

export const useRoomStore = create<RoomStore>((set, get) => ({
  currentRoom: null,
  myTeam: null,
  myRole: null,
  isLoading: false,
  error: null,

  createRoom: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const teams: Team[] = Array.from({ length: params.teamCount }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `팀 ${i + 1}`,
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        members: [],
        score: 0,
      }))

      const room: Room = {
        id: crypto.randomUUID(),
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        name: params.name,
        industryType: params.industryType,
        teamCount: params.teamCount,
        maxMembersPerTeam: params.maxMembersPerTeam,
        teams,
        status: 'waiting',
        currentQuest: 0,
        createdAt: new Date().toISOString(),
      }

      set({ currentRoom: room, isLoading: false })
      return room
    } catch (error) {
      const message = error instanceof Error ? error.message : '방 생성 실패'
      set({ isLoading: false, error: message })
      return null
    }
  },

  joinRoom: async (code) => {
    set({ isLoading: true, error: null })
    try {
      // Mock: In production, this would call the API
      const room = get().currentRoom
      if (room && room.code === code) {
        set({ isLoading: false })
        return true
      }
      // Simulate finding a room
      set({ isLoading: false, error: '방을 찾을 수 없습니다' })
      return false
    } catch (error) {
      const message = error instanceof Error ? error.message : '방 참가 실패'
      set({ isLoading: false, error: message })
      return false
    }
  },

  joinTeam: async (teamId, role) => {
    const room = get().currentRoom
    if (!room) return false

    const team = room.teams.find((t) => t.id === teamId)
    if (!team) return false

    set({ myTeam: team, myRole: role })
    return true
  },

  setRoom: (room) => set({ currentRoom: room }),
  setMyTeam: (team) => set({ myTeam: team }),
  leaveRoom: () => set({ currentRoom: null, myTeam: null, myRole: null }),

  updateRoom: (updates) => {
    const room = get().currentRoom
    if (!room) return
    set({ currentRoom: { ...room, ...updates } })
  },

  updateTeam: (teamId, updates) => {
    const room = get().currentRoom
    if (!room) return
    set({
      currentRoom: {
        ...room,
        teams: room.teams.map((t) =>
          t.id === teamId ? { ...t, ...updates } : t
        ),
      },
    })
  },
}))
