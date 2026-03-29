import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppUser, GameRoom, BattleSession, QuestResult } from './types'

interface AppState {
  readonly user: AppUser | null
  readonly currentRoom: GameRoom | null
  readonly rooms: ReadonlyArray<GameRoom>
  readonly battle: BattleSession | null
  readonly questResults: ReadonlyArray<QuestResult>
  readonly notifications: ReadonlyArray<{ id: string; message: string; type: 'info' | 'success' | 'error' }>
}

type AppAction =
  | { type: 'SET_USER'; payload: AppUser | null }
  | { type: 'UPDATE_USER'; payload: Partial<AppUser> }
  | { type: 'SET_ROOMS'; payload: ReadonlyArray<GameRoom> }
  | { type: 'ADD_ROOM'; payload: GameRoom }
  | { type: 'UPDATE_ROOM'; payload: { id: string } & Partial<GameRoom> }
  | { type: 'SET_CURRENT_ROOM'; payload: GameRoom | null }
  | { type: 'JOIN_ROOM'; payload: { room: GameRoom; participant: { userId: string; name: string; role: 'learner' | 'admin' } } }
  | { type: 'SET_BATTLE'; payload: BattleSession | null }
  | { type: 'UPDATE_BATTLE'; payload: Partial<BattleSession> }
  | { type: 'ADD_QUEST_RESULT'; payload: QuestResult }
  | { type: 'SET_QUEST_RESULTS'; payload: ReadonlyArray<QuestResult> }
  | { type: 'ADD_NOTIFICATION'; payload: { message: string; type: 'info' | 'success' | 'error' } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'LOGOUT' }

const STORAGE_KEY = 'beyond-ai-state'

function loadState(): Partial<AppState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        user: parsed.user || null,
        rooms: parsed.rooms || [],
        questResults: parsed.questResults || [],
      }
    }
  } catch {
    // ignore
  }
  return {}
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      rooms: state.rooms,
      questResults: state.questResults,
    }))
  } catch {
    // ignore
  }
}

const initialLoaded = loadState()

const initialState: AppState = {
  user: initialLoaded.user || null,
  currentRoom: null,
  rooms: initialLoaded.rooms || [],
  battle: null,
  questResults: initialLoaded.questResults || [],
  notifications: [],
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'UPDATE_USER':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload }
    case 'ADD_ROOM':
      return { ...state, rooms: [...state.rooms, action.payload] }
    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
        currentRoom: state.currentRoom?.id === action.payload.id
          ? { ...state.currentRoom, ...action.payload }
          : state.currentRoom,
      }
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload }
    case 'JOIN_ROOM': {
      const newParticipant = {
        userId: action.payload.participant.userId,
        name: action.payload.participant.name,
        role: action.payload.participant.role,
        joinedAt: new Date().toISOString(),
        isReady: false,
      }
      const updatedRoom = {
        ...action.payload.room,
        participants: [...action.payload.room.participants, newParticipant],
      }
      return {
        ...state,
        currentRoom: updatedRoom,
        rooms: state.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r),
      }
    }
    case 'SET_BATTLE':
      return { ...state, battle: action.payload }
    case 'UPDATE_BATTLE':
      return state.battle
        ? { ...state, battle: { ...state.battle, ...action.payload } }
        : state
    case 'ADD_QUEST_RESULT':
      return { ...state, questResults: [...state.questResults, action.payload] }
    case 'SET_QUEST_RESULTS':
      return { ...state, questResults: action.payload }
    case 'ADD_NOTIFICATION': {
      const id = crypto.randomUUID()
      return {
        ...state,
        notifications: [...state.notifications, { id, ...action.payload }],
      }
    }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      }
    case 'LOGOUT':
      return { ...initialState, user: null, rooms: state.rooms, questResults: [] }
    default:
      return state
  }
}

interface AppContextType {
  readonly state: AppState
  readonly dispatch: React.Dispatch<AppAction>
  readonly login: (name: string, role: 'learner' | 'admin') => void
  readonly logout: () => void
  readonly createRoom: (name: string) => GameRoom
  readonly joinRoom: (code: string) => GameRoom | null
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Persist on every state change
  saveState(state)

  const login = useCallback((name: string, role: 'learner' | 'admin') => {
    const user: AppUser = {
      id: crypto.randomUUID(),
      name,
      email: `${name.toLowerCase().replace(/\s/g, '')}@beyond-ai.kr`,
      role,
      teamId: null,
      roomCode: null,
      totalScore: 0,
      badges: [],
    }
    dispatch({ type: 'SET_USER', payload: user })
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' })
  }, [])

  const createRoom = useCallback((name: string): GameRoom => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const room: GameRoom = {
      id: crypto.randomUUID(),
      code,
      name,
      hostId: state.user?.id || '',
      hostName: state.user?.name || '',
      activeQuestId: null,
      status: 'waiting',
      participants: state.user ? [{
        userId: state.user.id,
        name: state.user.name,
        role: state.user.role,
        joinedAt: new Date().toISOString(),
        isReady: true,
      }] : [],
      createdAt: new Date().toISOString(),
      maxParticipants: 20,
    }
    dispatch({ type: 'ADD_ROOM', payload: room })
    dispatch({ type: 'SET_CURRENT_ROOM', payload: room })
    if (state.user) {
      dispatch({ type: 'UPDATE_USER', payload: { roomCode: code } })
    }
    return room
  }, [state.user])

  const joinRoom = useCallback((code: string): GameRoom | null => {
    const room = state.rooms.find(r => r.code === code.toUpperCase())
    if (!room || !state.user) return null
    if (room.participants.some(p => p.userId === state.user?.id)) {
      dispatch({ type: 'SET_CURRENT_ROOM', payload: room })
      return room
    }
    dispatch({
      type: 'JOIN_ROOM',
      payload: {
        room,
        participant: {
          userId: state.user.id,
          name: state.user.name,
          role: state.user.role,
        },
      },
    })
    dispatch({ type: 'UPDATE_USER', payload: { roomCode: code.toUpperCase() } })
    return room
  }, [state.rooms, state.user])

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout, createRoom, joinRoom }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
