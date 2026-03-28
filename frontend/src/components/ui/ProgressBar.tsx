import clsx from 'clsx'

interface ProgressBarProps {
  readonly value: number
  readonly max?: number
  readonly variant?: 'human' | 'ai' | 'default'
  readonly label?: string
  readonly showValue?: boolean
  readonly className?: string
  readonly animated?: boolean
}

const variantStyles: Record<string, string> = {
  human: 'bg-human',
  ai: 'bg-ai',
  default: 'bg-brutal-yellow',
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  label,
  showValue = true,
  className,
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={clsx('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="font-display font-bold text-sm uppercase">{label}</span>}
          {showValue && <span className="font-mono text-sm font-bold">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="brutal-border h-6 bg-brutal-light-gray overflow-hidden">
        <div
          className={clsx(
            'h-full',
            variantStyles[variant],
            animated && 'transition-all duration-700 ease-out',
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}
