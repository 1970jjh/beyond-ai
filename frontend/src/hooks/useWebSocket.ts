import { useEffect, useCallback, useSyncExternalStore } from 'react'
import { wsService, type WSEventType, type WSListener } from '../services/websocket'

function subscribe(callback: () => void): () => void {
  const unsub = wsService.on('*', callback)
  return unsub
}

function getSnapshot(): boolean {
  return wsService.connected
}

export function useWebSocket(roomCode: string | null) {
  const isConnected = useSyncExternalStore(subscribe, getSnapshot)

  useEffect(() => {
    if (!roomCode) return
    wsService.connect(roomCode)
    return () => wsService.disconnect()
  }, [roomCode])

  const send = useCallback((type: WSEventType, payload: Record<string, unknown>) => {
    wsService.send(type, payload)
  }, [])

  return { isConnected, send }
}

export function useWSEvent(type: WSEventType, handler: WSListener) {
  useEffect(() => {
    return wsService.on(type, handler)
  }, [type, handler])
}
