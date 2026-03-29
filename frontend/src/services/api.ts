const BASE_URL = '/api/v1'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
    throw new Error('인증이 만료되었습니다')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: '요청 실패' }))
    throw new Error(data.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

export interface BattleStartData {
  readonly quest_id: number
  readonly task_description: string
  readonly difficulty?: 'beginner' | 'intermediate' | 'advanced'
  readonly time_limit_sec?: number
  readonly constraints?: ReadonlyArray<string>
}

export interface BattleResponseData {
  readonly id: string
  readonly quest_id: number
  readonly status: string
  readonly result: string
  readonly mode: string
  readonly difficulty: string
  readonly task_description: string
  readonly human_submission: string | null
  readonly ai_submission: string | null
  readonly human_scores: {
    readonly quality: number
    readonly creativity: number
    readonly execution: number
    readonly efficiency: number
    readonly total: number
    readonly feedback: string
  } | null
  readonly ai_scores: {
    readonly quality: number
    readonly creativity: number
    readonly execution: number
    readonly efficiency: number
    readonly total: number
    readonly feedback: string
  } | null
  readonly comparison: string | null
  readonly time_limit_sec: number
  readonly hint_count: number
  readonly ai_provider: string | null
}

export interface PersonaData {
  readonly id: string
  readonly name: string
  readonly title: string
  readonly personality: string
  readonly expertise: ReadonlyArray<string>
  readonly communication_style: string
  readonly catchphrase: string
  readonly strengths: ReadonlyArray<string>
  readonly weaknesses: ReadonlyArray<string>
}

export interface LeaderboardEntry {
  readonly rank: number
  readonly user_id: string
  readonly display_name: string
  readonly total_points: number
  readonly courses_completed: number
  readonly lessons_completed: number
}

export interface UserData {
  readonly id: string
  readonly tenant_id: string
  readonly email: string
  readonly display_name: string
  readonly role: string
  readonly is_active: boolean
}

export interface TokenData {
  readonly access_token: string
  readonly refresh_token: string
  readonly token_type: string
}

export interface PointsSummaryData {
  readonly total_points: number
  readonly transaction_count: number
}

export interface UserBadgeData {
  readonly badge: {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly icon_url: string
    readonly condition_type: string
    readonly condition_value: number
  }
  readonly earned_at: string
}

export const authApi = {
  register: (data: { tenant_slug: string; email: string; display_name: string; password: string }) =>
    request<UserData>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { tenant_slug: string; email: string; password: string }) =>
    request<TokenData>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken: string) =>
    request<TokenData>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),
  me: () => request<UserData>('/auth/me'),
}

export const coursesApi = {
  list: () => request('/courses'),
  create: (data: { title: string; description?: string; difficulty_level?: number }) =>
    request('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; description?: string; is_published?: boolean }) =>
    request(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  enroll: (id: string) =>
    request(`/courses/${id}/enroll`, { method: 'POST' }),
}

export const gamificationApi = {
  leaderboard: (limit = 20) => request<ReadonlyArray<LeaderboardEntry>>(`/gamification/leaderboard?limit=${limit}`),
  myPoints: () => request<PointsSummaryData>('/gamification/points/me'),
  myBadges: () => request<ReadonlyArray<UserBadgeData>>('/gamification/badges/me'),
  awardPoints: (userId: string, data: { amount: number; reason: string }) =>
    request(`/gamification/points/${userId}`, { method: 'POST', body: JSON.stringify(data) }),
}

export const usersApi = {
  list: () => request<ReadonlyArray<UserData>>('/users'),
  updateRole: (userId: string, role: string) =>
    request(`/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
}

export const battleApi = {
  start: (data: BattleStartData) =>
    request<BattleResponseData>('/battle/start', { method: 'POST', body: JSON.stringify(data) }),

  submit: (battleId: string, submission: string) =>
    request<BattleResponseData>(`/battle/${battleId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submission }),
    }),

  streamAiProcess: (battleId: string, onEvent: (event: { type: string; data: unknown }) => void): (() => void) => {
    const url = `${BASE_URL}/battle/${battleId}/stream`
    const eventSource = new EventSource(url)

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        onEvent(parsed)
      } catch {
        onEvent({ type: 'content', data: e.data })
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  },

  switchMode: (battleId: string, mode: string, aiRole?: string) =>
    request<BattleResponseData>(`/battle/${battleId}/mode`, {
      method: 'POST',
      body: JSON.stringify({ mode, ai_role: aiRole }),
    }),

  getCoaching: (battleId: string, question: string, currentProgress: string) =>
    request<{ content: string; provider: string; model: string }>(`/battle/${battleId}/coach`, {
      method: 'POST',
      body: JSON.stringify({ question, current_progress: currentProgress }),
    }),

  getReview: (battleId: string, submission: string) =>
    request<{ content: string; provider: string; model: string }>(`/battle/${battleId}/review`, {
      method: 'POST',
      body: JSON.stringify({ submission }),
    }),

  myBattles: (questId?: number) => {
    const params = questId ? `?quest_id=${questId}` : ''
    return request<{ battles: ReadonlyArray<BattleResponseData>; total: number }>(`/battle/my${params}`)
  },

  get: (battleId: string) =>
    request<BattleResponseData>(`/battle/${battleId}`),

  getAllPersonas: () =>
    request<ReadonlyArray<PersonaData>>('/battle/personas/all'),

  getPersona: (questId: number) =>
    request<PersonaData>(`/battle/personas/${questId}`),

  getDifficulty: (level: string) =>
    request<{ level: string; params: Record<string, number> }>(`/battle/difficulty/${level}`),
}
