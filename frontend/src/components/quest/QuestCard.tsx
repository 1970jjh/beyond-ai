import { motion } from 'framer-motion'
import { Lock, Play, CheckCircle, Clock } from 'lucide-react'
import clsx from 'clsx'
import type { Quest } from '../../types'
import { Card } from '../ui/Card'

interface QuestCardProps {
  readonly quest: Quest
  readonly onSelect?: (quest: Quest) => void
}

const statusConfig = {
  locked: { icon: Lock, label: '잠김', color: 'text-brutal-gray' },
  active: { icon: Play, label: '진행 중', color: 'text-brutal-green' },
  completed: { icon: CheckCircle, label: '완료', color: 'text-human' },
  upcoming: { icon: Clock, label: '예정', color: 'text-brutal-orange' },
} as const

const monthNames = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

export function QuestCard({ quest, onSelect }: QuestCardProps) {
  const status = statusConfig[quest.status]
  const Icon = status.icon
  const isClickable = quest.status !== 'locked'

  return (
    <motion.div
      whileHover={isClickable ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        className={clsx(
          'relative overflow-hidden',
          quest.status === 'locked' && 'opacity-60',
        )}
        onClick={isClickable && onSelect ? () => onSelect(quest) : undefined}
      >
        {/* Month badge */}
        <div className="absolute top-0 right-0 bg-brutal-black text-brutal-white font-display font-bold text-sm px-3 py-1">
          {monthNames[quest.month - 1]}
        </div>

        <div className="flex items-start gap-4 pt-2">
          <div className={clsx('brutal-border p-3', status.color)}>
            <Icon size={24} />
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx('text-xs font-bold uppercase', status.color)}>
                {status.label}
              </span>
            </div>
            <h3 className="font-display font-bold text-lg mb-1">{quest.title}</h3>
            <p className="text-sm text-brutal-gray">{quest.description}</p>

            <div className="mt-3 flex items-center gap-2">
              <span className="brutal-border px-2 py-0.5 text-xs font-bold bg-brutal-light-gray">
                {quest.coreSkill}
              </span>
              <span className="brutal-border px-2 py-0.5 text-xs font-bold bg-brutal-light-gray uppercase">
                {quest.difficulty}
              </span>
            </div>

            {quest.humanScore !== null && quest.aiScore !== null && (
              <div className="mt-3 flex gap-4">
                <span className="font-mono text-sm font-bold text-human">
                  사람: {quest.humanScore}
                </span>
                <span className="font-mono text-sm font-bold text-ai">
                  AI: {quest.aiScore}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
