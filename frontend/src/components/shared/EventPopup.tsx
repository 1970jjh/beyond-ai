import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Clock, Trophy, Shuffle, Bot, Lightbulb, Snowflake, Star, HelpCircle, Skull } from 'lucide-react'
import { useGameStore, type GameEvent } from '../../stores/gameStore'

const EVENT_ICONS: Record<GameEvent['type'], typeof Zap> = {
  sudden_quest: Zap,
  time_bonus: Clock,
  score_boost: Trophy,
  team_swap: Shuffle,
  ai_upgrade: Bot,
  hint_drop: Lightbulb,
  freeze: Snowflake,
  double_points: Star,
  wildcard: HelpCircle,
  boss_raid: Skull,
}

const EVENT_COLORS: Record<GameEvent['type'], string> = {
  sudden_quest: 'bg-brutal-red',
  time_bonus: 'bg-brutal-green',
  score_boost: 'bg-brutal-yellow text-brutal-black',
  team_swap: 'bg-brutal-purple',
  ai_upgrade: 'bg-brutal-red',
  hint_drop: 'bg-brutal-blue',
  freeze: 'bg-brutal-blue',
  double_points: 'bg-brutal-yellow text-brutal-black',
  wildcard: 'bg-brutal-orange',
  boss_raid: 'bg-brutal-black border-brutal-red',
}

interface EventPopupProps {
  readonly event?: GameEvent | null
  readonly onClose?: () => void
}

export function EventPopup({ event: propEvent, onClose: propOnClose }: EventPopupProps = {}) {
  const { activeEvent: storeEvent, clearEvent: storeClearEvent } = useGameStore()
  const activeEvent = propEvent ?? storeEvent
  const clearEvent = propOnClose ?? storeClearEvent

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-brutal-black/80"
            onClick={clearEvent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Popup */}
          <motion.div
            className={`relative brutal-border-thick p-8 md:p-12 text-center shadow-brutal-xl text-brutal-white max-w-md w-full ${EVENT_COLORS[activeEvent.type]}`}
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <button
              onClick={clearEvent}
              className="absolute top-3 right-3 p-1 hover:bg-brutal-white/20 cursor-pointer bg-transparent border-none text-current"
            >
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              {(() => {
                const Icon = EVENT_ICONS[activeEvent.type]
                return <Icon size={48} className="mx-auto mb-4" />
              })()}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="font-mono text-xs uppercase tracking-wider mb-2 opacity-80">
                돌발 이벤트!
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl uppercase mb-3">
                {activeEvent.title}
              </h2>
              <p className="font-body text-lg opacity-90 mb-4">
                {activeEvent.description}
              </p>
              {activeEvent.duration > 0 && (
                <div className="font-mono font-bold text-sm">
                  지속 시간: {activeEvent.duration}초
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
