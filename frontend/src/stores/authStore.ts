import { create } from 'zustand'
import type { UserRole } from '../types'
import { authApi } from '../services/api'

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
  readonly isLoading: boolean
  readonly authError: string | null
}

interface AuthActions {
  loginLocal: (name: string, role: UserRole) => void
  loginWithApi: (tenantSlug: string, email: string, password: string) => Promise<boolean>
  registerWithApi: (tenantSlug: string, email: string, displayName: string, password: string) => Promise<boolean>
  fetchMe: () => Promise<void>
  logout: () => void
  updateScore: (points: number) => void
  addBadge: (badge: { id: string; name: string; icon: string; tier: string }) => void
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

function mapBeRole(beRole: string): UserRole {
  if (beRole === 'ADMIN' || beRole === 'SUPER_ADMIN') return 'admin'
  return 'learner'
}

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
  isLoading: false,
  authError: null,

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
    set({ user, isAuthenticated: true, authError: null })
  },

  loginWithApi: async (tenantSlug, email, password) => {
    set({ isLoading: true, authError: null })
    try {
      const tokens = await authApi.login({ tenant_slug: tenantSlug, email, password })
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)

      const me = await authApi.me()
      const role = mapBeRole(me.role)
      const user: LocalUser = {
        id: me.id,
        name: me.display_name,
        email: me.email,
        role,
        title: role === 'admin' ? '관리자' : '학습자',
        totalScore: 0,
        badges: [],
        teamId: null,
      }
      saveUser(user)
      set({ user, isAuthenticated: true, isLoading: false })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인 실패'
      set({ isLoading: false, authError: message })
      return false
    }
  },

  registerWithApi: async (tenantSlug, email, displayName, password) => {
    set({ isLoading: true, authError: null })
    try {
      await authApi.register({ tenant_slug: tenantSlug, email, display_name: displayName, password })
      return await get().loginWithApi(tenantSlug, email, password)
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입 실패'
      set({ isLoading: false, authError: message })
      return false
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    try {
      const me = await authApi.me()
      const role = mapBeRole(me.role)
      const currentUser = get().user
      const user: LocalUser = {
        id: me.id,
        name: me.display_name,
        email: me.email,
        role,
        title: role === 'admin' ? '관리자' : '학습자',
        totalScore: currentUser?.totalScore ?? 0,
        badges: currentUser?.badges ?? [],
        teamId: currentUser?.teamId ?? null,
      }
      saveUser(user)
      set({ user, isAuthenticated: true })
    } catch {
      // Token invalid, clear it
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },

  logout: () => {
    saveUser(null)
    localStorage.removeItem('beyond-ai-results')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false, authError: null })
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

  clearError: () => set({ authError: null }),
}))
