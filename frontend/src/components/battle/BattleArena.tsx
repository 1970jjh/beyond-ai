import { motion } from 'framer-motion'
import { Swords, User, Bot } from 'lucide-react'
import { ScoreDisplay } from '../ui/ScoreDisplay'
import { ProgressBar } from '../ui/ProgressBar'
import type { BattleState } from '../../types'

interface BattleArenaProps {
  readonly battle: BattleState
}

export function BattleArena({ battle }: BattleArenaProps) {
  const totalHuman = battle.scores.quality.human + battle.scores.creativity.human +
    battle.scores.execution.human + battle.scores.efficiency.human
  const totalAi = battle.scores.quality.ai + battle.scores.creativity.ai +
    battle.scores.execution.ai + battle.scores.efficiency.ai

  return (
    <div className="space-y-8">
      {/* VS Header */}
      <div className="flex items-center justify-center gap-8">
        <motion.div
          className="flex items-center gap-3"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="brutal-border bg-human p-3 text-brutal-white">
            <User size={32} />
          </div>
          <span className="font-display font-bold text-2xl uppercase">Human</span>
        </motion.div>

        <motion.div
          className="brutal-border bg-brutal-yellow p-4 rotate-12"
          animate={{ rotate: [12, -12, 12] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Swords size={32} />
        </motion.div>

        <motion.div
          className="flex items-center gap-3"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="font-display font-bold text-2xl uppercase">AI</span>
          <div className="brutal-border bg-ai p-3 text-brutal-white">
            <Bot size={32} />
          </div>
        </motion.div>
      </div>

      {/* Score Board */}
      <div className="grid grid-cols-2 gap-6">
        <ScoreDisplay score={totalHuman} label="사람 팀" variant="human" size="lg" />
        <ScoreDisplay score={totalAi} label="AI" variant="ai" size="lg" />
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <ProgressBar value={battle.humanProgress} variant="human" label="진행률" />
        </div>
        <div className="space-y-3">
          <ProgressBar value={battle.aiProgress} variant="ai" label="진행률" />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="brutal-border bg-brutal-white p-6 shadow-brutal">
        <h3 className="font-display font-bold text-lg uppercase mb-4">평가 항목</h3>
        <div className="space-y-4">
          {([
            { key: 'quality', label: '품질' },
            { key: 'creativity', label: '창의성' },
            { key: 'execution', label: '실행력' },
            { key: 'efficiency', label: '시간 효율' },
          ] as const).map(({ key, label }) => (
            <div key={key} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <ProgressBar
                value={battle.scores[key].human}
                variant="human"
                showValue={false}
              />
              <span className="font-display font-bold text-sm uppercase w-20 text-center">
                {label}
              </span>
              <ProgressBar
                value={battle.scores[key].ai}
                variant="ai"
                showValue={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Timer */}
      {battle.result === 'in_progress' && (
        <motion.div
          className="brutal-border bg-brutal-yellow p-4 text-center shadow-brutal"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="font-display font-bold text-sm uppercase">남은 시간</span>
          <div className="font-mono font-bold text-3xl">
            {Math.floor(battle.timeRemaining / 60)}:{String(battle.timeRemaining % 60).padStart(2, '0')}
          </div>
        </motion.div>
      )}
    </div>
  )
}
