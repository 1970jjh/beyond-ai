import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, Lightbulb } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { Button } from '../ui/Button'

interface HelpButtonProps {
  readonly hints?: ReadonlyArray<string>
  readonly className?: string
}

const DEFAULT_HINTS = [
  '문제를 작은 단위로 분해해보세요.',
  '유사한 사례를 먼저 조사해보세요.',
  'AI의 약점은 창의적 사고와 공감 능력입니다.',
]

export function HelpButton({ hints = DEFAULT_HINTS, className }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentHint, setCurrentHint] = useState<string | null>(null)
  const { helpCount, maxHelps, useHelp } = useGameStore()
  const remaining = maxHelps - helpCount

  const handleUseHelp = () => {
    if (useHelp()) {
      const hintIndex = helpCount // helpCount was incremented inside useHelp
      setCurrentHint(hints[hintIndex % hints.length])
    }
  }

  return (
    <>
      {/* Help FAB */}
      <motion.button
        className={`fixed bottom-6 left-6 z-40 brutal-border bg-brutal-yellow text-brutal-black p-4 shadow-brutal cursor-pointer ${className ?? ''}`}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <HelpCircle size={24} />
        {remaining > 0 && (
          <span className="absolute -top-2 -right-2 bg-brutal-red text-brutal-white font-mono font-bold text-xs w-6 h-6 flex items-center justify-center brutal-border">
            {remaining}
          </span>
        )}
      </motion.button>

      {/* Help Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-brutal-black/60"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="relative brutal-border-thick bg-brutal-white p-6 shadow-brutal-xl w-full max-w-md"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 p-1 hover:bg-brutal-light-gray cursor-pointer bg-transparent border-none"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <Lightbulb size={24} className="text-brutal-yellow" />
                <h3 className="font-display font-bold text-xl uppercase">도움말</h3>
              </div>

              <div className="mb-4">
                <span className="font-mono text-sm text-brutal-gray">
                  남은 힌트: <span className="font-bold text-brutal-black">{remaining}/{maxHelps}</span>
                </span>
              </div>

              {currentHint && (
                <motion.div
                  className="brutal-border bg-brutal-yellow/20 p-4 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="font-mono text-xs uppercase text-brutal-gray mb-1">힌트</div>
                  <p className="font-body font-bold">{currentHint}</p>
                </motion.div>
              )}

              <Button
                variant="primary"
                className="w-full"
                disabled={remaining <= 0}
                onClick={handleUseHelp}
              >
                {remaining > 0 ? `힌트 사용 (${remaining}회 남음)` : '힌트 소진됨'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
