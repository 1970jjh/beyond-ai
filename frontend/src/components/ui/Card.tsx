import { type ReactNode } from 'react'
import clsx from 'clsx'

type CardVariant = 'default' | 'highlight' | 'human' | 'ai'

interface CardProps {
  readonly variant?: CardVariant
  readonly className?: string
  readonly children: ReactNode
  readonly onClick?: () => void
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-brutal-white',
  highlight: 'bg-brutal-yellow',
  human: 'bg-human/10 border-human',
  ai: 'bg-ai/10 border-ai',
}

export function Card({ variant = 'default', className, children, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'brutal-border shadow-brutal p-6 transition-all duration-150',
        onClick && 'cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm',
        variantStyles[variant],
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      {children}
    </div>
  )
}
