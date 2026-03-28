import { motion } from 'framer-motion'
import { BadgeUI } from '../ui/Badge'
import type { Badge } from '../../types'

interface BadgeShowcaseProps {
  readonly badges: ReadonlyArray<Badge>
  readonly title?: string
}

export function BadgeShowcase({ badges, title = '획득한 배지' }: BadgeShowcaseProps) {
  return (
    <div className="brutal-border bg-brutal-white p-6 shadow-brutal">
      <h3 className="font-display font-bold text-lg uppercase mb-4">{title}</h3>
      {badges.length === 0 ? (
        <p className="text-brutal-gray text-sm">아직 획득한 배지가 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
            >
              <BadgeUI
                label={badge.name}
                tier={badge.tier}
                icon={badge.icon}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
