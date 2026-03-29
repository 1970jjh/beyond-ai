import { create } from 'zustand'
import type { UserRole } from '../types'

interface LocalUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly title: string
  readonly totalScore: number
  readonly badges: ReadonlyArray<{ id: string; name: string; icon: string; tier: string }>
  readonly teamId: string | null
}

interface AuthState {
  readonly user: LocalUser | null
  readonly isAuthenticated: boolean
}

interface AuthActions {
  loginLocal: (name: string, role: UserRole) => void
  logout: () => void
  updateScore: (points: number) => void
  addBadge: (badge: { id: string; name: string; icon: string; tier: string }) => void
}

type AuthStore = AuthState & AuthActions

function loadUser(): LocalUser | null {
  try {
    const saved = localStorage.getItem('beyond-ai-user')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function saveUser(user: LocalUser | null) {
  if (user) {
    localStorage.setItem('beyond-ai-user', JSON.stringify(user))
  } else {
    localStorage.removeItem('beyond-ai-user')
  }
}

const savedUser = loadUser()

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: savedUser,
  isAuthenticated: !!savedUser,

  loginLocal: (name, role) => {
    const user: LocalUser = {
      id: crypto.randomUUID(),
      name,
      email: `${name.toLowerCase().replace(/\s/g, '')}@beyond-ai.kr`,
      role,
      title: role === 'admin' ? '관리자' : '학습자',
      totalScore: 0,
      badges: [],
      teamId: null,
    }
    saveUser(user)
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    saveUser(null)
    localStorage.removeItem('beyond-ai-results')
    set({ user: null, isAuthenticated: false })
  },

  updateScore: (points) => {
    const user = get().user
    if (!user) return
    const updated = { ...user, totalScore: user.totalScore + points }
    saveUser(updated)
    set({ user: updated })
  },

  addBadge: (badge) => {
    const user = get().user
    if (!user) return
    if (user.badges.some(b => b.id === badge.id)) return
    const updated = { ...user, badges: [...user.badges, badge] }
    saveUser(updated)
    set({ user: updated })
  },
}))
