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

export const authApi = {
  register: (data: { tenant_slug: string; email: string; display_name: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { tenant_slug: string; email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken: string) =>
    request<{ access_token: string; refresh_token: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),
  me: () => request('/auth/me'),
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
  leaderboard: (limit = 20) => request(`/gamification/leaderboard?limit=${limit}`),
  myPoints: () => request('/gamification/points/me'),
  myBadges: () => request('/gamification/badges/me'),
  awardPoints: (userId: string, data: { amount: number; reason: string }) =>
    request(`/gamification/points/${userId}`, { method: 'POST', body: JSON.stringify(data) }),
}

export const usersApi = {
  list: () => request('/users'),
  updateRole: (userId: string, role: string) =>
    request(`/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
}
