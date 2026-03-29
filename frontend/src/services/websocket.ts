type WSEventType =
  | 'room:joined'
  | 'room:left'
  | 'room:updated'
  | 'team:member_joined'
  | 'team:member_left'
  | 'team:role_changed'
  | 'game:timer_start'
  | 'game:timer_pause'
  | 'game:timer_resume'
  | 'game:timer_stop'
  | 'game:timer_tick'
  | 'game:event_triggered'
  | 'game:event_cleared'
  | 'battle:started'
  | 'battle:submission'
  | 'battle:result'
  | 'presence:online'
  | 'presence:offline'
  | 'chat:message'

interface WSMessage {
  readonly type: WSEventType
  readonly payload: Record<string, unknown>
  readonly timestamp: string
  readonly senderId?: string
}

type WSListener = (message: WSMessage) => void

interface WebSocketServiceState {
  readonly socket: WebSocket | null
  readonly isConnected: boolean
  readonly reconnectAttempts: number
}

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY = 1000

class WebSocketService {
  private state: WebSocketServiceState = {
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
  }

  private listeners = new Map<WSEventType | '*', Set<WSListener>>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url: string | null = null
  private roomCode: string | null = null

  connect(roomCode: string): void {
    this.roomCode = roomCode

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    this.url = `${protocol}//${host}/ws/room/${roomCode}`

    this.doConnect()
  }

  private doConnect(): void {
    if (!this.url) return

    try {
      const token = localStorage.getItem('access_token')
      const urlWithAuth = token ? `${this.url}?token=${token}` : this.url
      const socket = new WebSocket(urlWithAuth)

      socket.onopen = () => {
        this.state = { ...this.state, socket, isConnected: true, reconnectAttempts: 0 }
        this.emit({ type: 'presence:online', payload: {}, timestamp: new Date().toISOString() })
      }

      socket.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          this.notifyListeners(message)
        } catch {
          // Non-JSON messages ignored
        }
      }

      socket.onclose = () => {
        this.state = { ...this.state, socket: null, isConnected: false }
        this.scheduleReconnect()
      }

      socket.onerror = () => {
        socket.close()
      }

      this.state = { ...this.state, socket }
    } catch {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    const delay = RECONNECT_BASE_DELAY * Math.pow(2, this.state.reconnectAttempts)
    this.state = { ...this.state, reconnectAttempts: this.state.reconnectAttempts + 1 }

    this.reconnectTimer = setTimeout(() => {
      this.doConnect()
    }, delay)
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.state.socket?.close()
    this.state = { socket: null, isConnected: false, reconnectAttempts: 0 }
    this.roomCode = null
    this.url = null
  }

  send(type: WSEventType, payload: Record<string, unknown>): void {
    if (!this.state.socket || !this.state.isConnected) return

    const message: WSMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    }

    this.state.socket.send(JSON.stringify(message))
  }

  emit(message: WSMessage): void {
    this.send(message.type, message.payload)
  }

  on(type: WSEventType | '*', listener: WSListener): () => void {
    const set = this.listeners.get(type) ?? new Set()
    set.add(listener)
    this.listeners.set(type, set)

    return () => {
      set.delete(listener)
      if (set.size === 0) this.listeners.delete(type)
    }
  }

  off(type: WSEventType | '*', listener: WSListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  private notifyListeners(message: WSMessage): void {
    // Notify type-specific listeners
    this.listeners.get(message.type)?.forEach(fn => fn(message))
    // Notify wildcard listeners
    this.listeners.get('*')?.forEach(fn => fn(message))
  }

  get connected(): boolean {
    return this.state.isConnected
  }

  get currentRoomCode(): string | null {
    return this.roomCode
  }
}

export const wsService = new WebSocketService()
export type { WSEventType, WSMessage, WSListener }
