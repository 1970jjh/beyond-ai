import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, Star, Shuffle, AlertTriangle, Timer } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../components/ui/Button'

interface SuddenEvent {
  readonly id: string
  readonly type: 'bonus_time' | 'score_multiplier' | 'swap_roles' | 'mystery_challenge' | 'speed_round'
  readonly title: string
  readonly description: string
  readonly icon: string
  readonly color: string
  readonly borderColor: string
}

const EVENTS: ReadonlyArray<SuddenEvent> = [
  {
    id: 'e1', type: 'bonus_time', title: '보너스 타임',
    description: '추가 5분이 주어집니다! 마지막 기회를 잡으세요.',
    icon: '⏰', color: 'bg-brutal-green/10', borderColor: 'border-brutal-green',
  },
  {
    id: 'e2', type: 'score_multiplier', title: '점수 2배',
    description: '다음 30초간 획득하는 점수가 2배로 적용됩니다!',
    icon: '⭐', color: 'bg-brutal-yellow/10', borderColor: 'border-brutal-yellow',
  },
  {
    id: 'e3', type: 'swap_roles', title: '역할 교체',
    description: '팀원들의 역할이 랜덤으로 교체됩니다!',
    icon: '🔄', color: 'bg-brutal-purple/10', borderColor: 'border-brutal-purple',
  },
  {
    id: 'e4', type: 'mystery_challenge', title: '미스터리 챌린지',
    description: '숨겨진 보너스 과제가 나타났습니다! 완료하면 추가 점수!',
    icon: '❓', color: 'bg-brutal-orange/10', borderColor: 'border-brutal-orange',
  },
  {
    id: 'e5', type: 'speed_round', title: '스피드 라운드',
    description: '60초 안에 미니 퀴즈 5개를 풀어야 합니다!',
    icon: '⚡', color: 'bg-ai/10', borderColor: 'border-ai',
  },
]

const EVENT_ICONS = {
  bonus_time: Clock,
  score_multiplier: Star,
  swap_roles: Shuffle,
  mystery_challenge: AlertTriangle,
  speed_round: Timer,
} as const

export function EventsPage() {
  const [activeEvent, setActiveEvent] = useState<SuddenEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const triggerEvent = (event: SuddenEvent) => {
    setActiveEvent(event)
    setDismissed(false)
  }

  const dismissEvent = () => {
    setDismissed(true)
    setTimeout(() => {
      setActiveEvent(null)
      setDismissed(false)
    }, 300)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">돌발 이벤트</h1>
        <p className="text-brutal-gray text-lg">대결 중 발생하는 특별 이벤트</p>
      </div>

      {/* Active Event Overlay */}
      <AnimatePresence>
        {activeEvent && !dismissed && (
          <motion.div
            className="fixed inset-0 bg-brutal-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={clsx(
                'max-w-md w-full border-4 p-8 text-center',
                activeEvent.borderColor,
                activeEvent.color,
                'bg-brutal-white',
              )}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {activeEvent.icon}
              </motion.div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap size={20} className="text-brutal-yellow" />
                <span className="font-mono text-xs uppercase tracking-wider text-brutal-gray">돌발 이벤트</span>
              </div>

              <h2 className="font-display font-bold text-3xl uppercase mb-3 glitch" data-text={activeEvent.title}>
                {activeEvent.title}
              </h2>

              <p className="text-lg mb-8">{activeEvent.description}</p>

              <Button variant="primary" size="lg" onClick={dismissEvent}>
                확인
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EVENTS.map((event, index) => {
          const Icon = EVENT_ICONS[event.type]
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={clsx(
                  'brutal-border-thick p-6 cursor-pointer transition-all hover:shadow-brutal-lg',
                  event.color,
                  event.borderColor,
                )}
                onClick={() => triggerEvent(event)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerEvent(event) }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{event.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} />
                      <span className="font-mono text-xs uppercase tracking-wider text-brutal-gray">{event.type.replace('_', ' ')}</span>
                    </div>
                    <h3 className="font-display font-bold text-xl uppercase mb-2">{event.title}</h3>
                    <p className="text-sm text-brutal-gray">{event.description}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t-2 border-brutal-gray/20">
                  <span className="font-mono text-xs text-brutal-gray">클릭하여 미리보기</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Event Info */}
      <div className="brutal-border bg-brutal-light-gray p-6">
        <h3 className="font-display font-bold text-lg uppercase mb-3 flex items-center gap-2">
          <Zap size={18} className="text-brutal-yellow" />
          이벤트 시스템 안내
        </h3>
        <ul className="space-y-2 text-sm text-brutal-gray">
          <li className="flex items-start gap-2">
            <span className="text-brutal-yellow font-bold">&bull;</span>
            돌발 이벤트는 대결 중 랜덤으로 발생합니다
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brutal-yellow font-bold">&bull;</span>
            이벤트 발생 시 모든 참가자에게 동시에 알림됩니다
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brutal-yellow font-bold">&bull;</span>
            이벤트 효과는 사람 팀과 AI 모두에게 동일하게 적용됩니다
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brutal-yellow font-bold">&bull;</span>
            관리자가 수동으로 이벤트를 발동할 수도 있습니다
          </li>
        </ul>
      </div>
    </div>
  )
}
