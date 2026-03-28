import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ScoreDisplayProps {
  readonly score: number
  readonly label: string
  readonly variant: 'human' | 'ai'
  readonly size?: 'sm' | 'md' | 'lg'
  readonly className?: string
}

const sizeStyles: Record<string, { container: string; score: string; label: string }> = {
  sm: { container: 'p-3', score: 'text-2xl', label: 'text-xs' },
  md: { container: 'p-5', score: 'text-4xl', label: 'text-sm' },
  lg: { container: 'p-8', score: 'text-6xl', label: 'text-base' },
}

export function ScoreDisplay({
  score,
  label,
  variant,
  size = 'md',
  className,
}: ScoreDisplayProps) {
  const styles = sizeStyles[size]

  return (
    <div
      className={clsx(
        'brutal-border shadow-brutal text-center',
        variant === 'human' ? 'bg-human/10' : 'bg-ai/10',
        styles.container,
        className,
      )}
    >
      <div className={clsx('font-display font-bold uppercase tracking-wider mb-1', styles.label)}>
        {label}
      </div>
      <motion.div
        className={clsx(
          'font-mono font-bold',
          variant === 'human' ? 'text-human' : 'text-ai',
          styles.score,
        )}
        key={score}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {score}
      </motion.div>
    </div>
  )
}
