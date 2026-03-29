import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Play, Pause, Square } from 'lucide-react'
import clsx from 'clsx'
import { useGameStore } from '../../stores/gameStore'

interface GameTimerProps {
  readonly size?: 'sm' | 'md' | 'lg'
  readonly showControls?: boolean
  readonly className?: string
}

export function GameTimer({ size = 'md', showControls = false, className }: GameTimerProps) {
  const { timerSeconds, timerRunning, timerPaused, tickTimer, startTimer, pauseTimer, resumeTimer, stopTimer } = useGameStore()
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRunning && !timerPaused) {
      intervalRef.current = window.setInterval(tickTimer, 1000)
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerRunning, timerPaused, tickTimer])

  const minutes = Math.floor(timerSeconds / 60)
  const seconds = timerSeconds % 60
  const isLow = timerSeconds > 0 && timerSeconds <= 60
  const isCritical = timerSeconds > 0 && timerSeconds <= 10

  const sizeStyles = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl md:text-7xl',
  }

  return (
    <div className={clsx('text-center', className)}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <Clock size={size === 'lg' ? 20 : 14} className="text-brutal-yellow" />
        <span className="font-mono text-xs uppercase tracking-wider text-brutal-gray">
          {timerRunning ? (timerPaused ? '일시정지' : '남은 시간') : '타이머'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={timerSeconds}
          className={clsx(
            'font-mono font-bold tabular-nums',
            sizeStyles[size],
            isCritical ? 'text-brutal-red' : isLow ? 'text-brutal-orange' : 'text-brutal-yellow',
          )}
          initial={isCritical ? { scale: 1.1 } : undefined}
          animate={isCritical ? { scale: [1.1, 1, 1.1] } : { scale: 1 }}
          transition={isCritical ? { duration: 1, repeat: Infinity } : undefined}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </AnimatePresence>

      {showControls && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {!timerRunning ? (
            <>
              {[15, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => startTimer(min * 60)}
                  className="brutal-border bg-brutal-light-gray px-3 py-1 font-mono font-bold text-xs cursor-pointer hover:bg-brutal-yellow transition-colors"
                >
                  {min}분
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                onClick={timerPaused ? resumeTimer : pauseTimer}
                className="brutal-border bg-brutal-yellow px-3 py-2 cursor-pointer hover:bg-brutal-yellow/80 transition-colors"
              >
                {timerPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                onClick={stopTimer}
                className="brutal-border bg-brutal-red text-brutal-white px-3 py-2 cursor-pointer hover:bg-brutal-red/80 transition-colors"
              >
                <Square size={16} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
