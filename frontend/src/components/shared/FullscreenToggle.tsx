import { Maximize, Minimize } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

export function FullscreenToggle() {
  const { isFullscreen, toggleFullscreen } = useGameStore()

  return (
    <button
      onClick={toggleFullscreen}
      className="fixed top-4 right-4 z-40 brutal-border bg-brutal-black text-brutal-white p-2 shadow-brutal cursor-pointer hover:bg-brutal-gray transition-colors"
      title={isFullscreen ? '전체화면 종료' : '전체화면'}
    >
      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  )
}
