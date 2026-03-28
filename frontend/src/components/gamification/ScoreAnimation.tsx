import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface ScoreAnimationProps {
  readonly targetScore: number
  readonly duration?: number
  readonly className?: string
}

export function ScoreAnimation({ targetScore, duration = 1.5, className }: ScoreAnimationProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayScore(Math.round(eased * targetScore))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [targetScore, duration])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={targetScore}
        className={className}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
      >
        {displayScore.toLocaleString()}
      </motion.span>
    </AnimatePresence>
  )
}
