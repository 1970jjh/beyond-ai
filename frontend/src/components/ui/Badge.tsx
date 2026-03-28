import clsx from 'clsx'

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface BadgeProps {
  readonly label: string
  readonly tier?: BadgeTier
  readonly icon?: string
  readonly className?: string
}

const tierStyles: Record<BadgeTier, string> = {
  bronze: 'bg-orange-200 text-orange-900 border-orange-900',
  silver: 'bg-gray-200 text-gray-900 border-gray-900',
  gold: 'bg-yellow-200 text-yellow-900 border-yellow-900',
  platinum: 'bg-purple-200 text-purple-900 border-purple-900',
}

export function BadgeUI({ label, tier = 'bronze', icon, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-3 py-1 border-2 font-display font-bold text-xs uppercase tracking-wider',
        tierStyles[tier],
        className,
      )}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </span>
  )
}
