import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Swords, Clock, Target, Zap } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { QUEST_CONFIGS } from '../data/quests'

const CRITERIA = ['품질', '창의성', '실행력', '시간 효율'] as const

export function BattlePrepPage() {
  const { questId } = useParams()
  const navigate = useNavigate()
  const quest = questId ? QUEST_CONFIGS.find(q => q.id === questId) : QUEST_CONFIGS[2]

  const [countdown, setCountdown] = useState(3)
  const [started, setStarted] = useState(false)
  const [showStart, setShowStart] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      setShowStart(true)
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Navigate to battle after FIGHT! animation
  useEffect(() => {
    if (!started) return
    const timer = setTimeout(() => {
      navigate(questId ? `/battle/${questId}` : '/battle')
    }, 1500)
    return () => clearTimeout(timer)
  }, [started, questId, navigate])

  return (
    <div className="min-h-screen bg-brutal-black text-brutal-white relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanline z-10" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Quest Info */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="inline-block bg-brutal-yellow text-brutal-black font-mono font-bold text-xs uppercase tracking-wider px-3 py-1 border-2 border-brutal-black mb-4">
            QUEST #{String(quest?.month ?? 3).padStart(2, '0')}
          </span>
          <h1 className="font-display font-bold text-3xl md:text-4xl uppercase mb-4">
            {quest?.icon} {quest?.title ?? '사업 제안서 작성'}
          </h1>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {CRITERIA.map((c) => (
              <span key={c} className="border-2 border-brutal-gray px-3 py-1 font-mono text-xs uppercase tracking-wider text-brutal-gray">
                {c}
              </span>
            ))}
          </div>
        </motion.div>

        {/* VS Matchup */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center mb-12">
          {/* Human Panel */}
          <motion.div
            className="border-4 border-human p-6 md:p-8 text-center"
            style={{ background: 'linear-gradient(180deg, rgba(0,102,255,0.08) 0%, transparent 100%)' }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 border-3 border-human mb-4">
              <User size={32} className="text-human" />
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-human mb-2">HUMAN TEAM</div>
            <h2 className="font-display font-bold text-2xl md:text-3xl uppercase mb-4">사람 팀</h2>
            <div className="space-y-1">
              {['김민수', '이지은', '박준호', '최서연'].map((name) => (
                <div key={name} className="font-body text-sm text-brutal-gray">{name}</div>
              ))}
            </div>
          </motion.div>

          {/* VS Badge */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
          >
            <div
              className="w-20 h-20 md:w-24 md:h-24 bg-brutal-yellow text-brutal-black font-display font-bold text-2xl md:text-3xl flex items-center justify-center border-4 border-brutal-black glitch"
              data-text="VS"
            >
              VS
            </div>
          </motion.div>

          {/* AI Panel */}
          <motion.div
            className="border-4 border-ai p-6 md:p-8 text-center"
            style={{ background: 'linear-gradient(180deg, rgba(255,51,51,0.08) 0%, transparent 100%)' }}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 border-3 border-ai mb-4">
              <Bot size={32} className="text-ai" />
            </div>
            <div className="font-mono text-xs uppercase tracking-wider text-ai mb-2">AI</div>
            <h2 className="font-display font-bold text-2xl md:text-3xl uppercase mb-4">GPT-4o</h2>
            <div className="space-y-1 text-sm text-brutal-gray">
              <div className="flex items-center justify-center gap-1"><Zap size={12} /> 고급 추론</div>
              <div className="flex items-center justify-center gap-1"><Target size={12} /> 데이터 분석</div>
              <div className="flex items-center justify-center gap-1"><Swords size={12} /> 전략 수립</div>
            </div>
          </motion.div>
        </div>

        {/* Timer */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={16} className="text-brutal-yellow" />
            <span className="font-mono text-xs uppercase tracking-wider text-brutal-gray">제한 시간</span>
          </div>
          <div className="font-mono font-bold text-4xl neon-yellow tabular-nums">
            {Math.floor((quest?.timeLimit ?? 1800) / 60)}:{String((quest?.timeLimit ?? 1800) % 60).padStart(2, '0')}
          </div>
        </motion.div>

        {/* Countdown */}
        <div className="flex items-center justify-center h-40">
          <AnimatePresence mode="wait">
            {!showStart ? (
              <motion.div
                key={countdown}
                className="font-display font-bold text-8xl md:text-9xl neon-yellow"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.68, -0.55, 0.27, 1.55] }}
              >
                {countdown}
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {!started ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="text-2xl px-12 py-6 pulse-glow"
                    onClick={() => setStarted(true)}
                  >
                    <Swords size={28} />
                    대결 시작
                  </Button>
                ) : (
                  <div className="font-display font-bold text-6xl neon-yellow glitch" data-text="FIGHT!">
                    FIGHT!
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
