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
  getRooms: () => ReadonlyArray<Room>
}

type RoomStore = RoomState & RoomActions

const STORAGE_KEY = 'beyond-ai-rooms'

const TEAM_COLORS = [
  '#0055FF', '#FF3333', '#00CC66', '#8B5CF6',
  '#FF6600', '#FF00AA', '#00CCCC', '#FFE500',
]

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

function loadRooms(): ReadonlyArray<Room> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Room[]
  } catch {
    return []
  }
}

function saveRooms(rooms: ReadonlyArray<Room>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
}

function persistRoom(room: Room): void {
  const rooms = [...loadRooms()]
  const idx = rooms.findIndex((r) => r.id === room.id)
  if (idx >= 0) {
    rooms[idx] = room
  } else {
    rooms.push(room)
  }
  saveRooms(rooms)
}

function findRoomByCode(code: string): Room | null {
  const rooms = loadRooms()
  return rooms.find((r) => r.code === code) ?? null
}

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
        code: generateInviteCode(),
        name: params.name,
        industryType: params.industryType,
        teamCount: params.teamCount,
        maxMembersPerTeam: params.maxMembersPerTeam,
        teams,
        status: 'waiting',
        currentQuest: 0,
        createdAt: new Date().toISOString(),
      }

      persistRoom(room)
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
      const room = findRoomByCode(code.toUpperCase())
      if (room) {
        set({ currentRoom: room, isLoading: false })
        return true
      }
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
    const updated = { ...room, ...updates }
    persistRoom(updated)
    set({ currentRoom: updated })
  },

  updateTeam: (teamId, updates) => {
    const room = get().currentRoom
    if (!room) return
    const updated = {
      ...room,
      teams: room.teams.map((t) =>
        t.id === teamId ? { ...t, ...updates } : t
      ),
    }
    persistRoom(updated)
    set({ currentRoom: updated })
  },

  getRooms: () => loadRooms(),
}))
