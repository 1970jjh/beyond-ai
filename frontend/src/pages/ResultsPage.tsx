import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, ArrowRight, BarChart2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Button } from '../components/ui/Button'

const RESULT = {
  winner: 'human' as const,
  humanScore: 87,
  aiScore: 82,
  breakdown: [
    { label: '품질', human: 85, ai: 80 },
    { label: '창의성', human: 92, ai: 70 },
    { label: '실행력', human: 78, ai: 88 },
    { label: '시간 효율', human: 80, ai: 90 },
  ],
  badges: [
    { id: 'b1', name: 'AI 헌터', icon: '🎯', tier: 'bronze' },
    { id: 'b2', name: '창의력 마스터', icon: '💡', tier: 'gold' },
  ],
  xpGained: 250,
} as const

function useCountUp(target: number, duration: number = 1500) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let frame: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    const delay = setTimeout(() => {
      frame = requestAnimationFrame(animate)
    }, 800)

    return () => {
      clearTimeout(delay)
      cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return value
}

export function ResultsPage() {
  const humanCount = useCountUp(RESULT.humanScore)
  const aiCount = useCountUp(RESULT.aiScore)

  return (
    <div className="min-h-screen bg-brutal-black text-brutal-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none scanline z-10" />

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Winner Announcement */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.68, -0.55, 0.27, 1.55] }}
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Trophy size={48} className="mx-auto mb-4 text-brutal-yellow" />
          </motion.div>
          <h1
            className={clsx(
              'font-display font-bold text-4xl md:text-6xl uppercase mb-2',
              RESULT.winner === 'human' ? 'neon-blue' : 'neon-red',
            )}
          >
            {RESULT.winner === 'human' ? '사람이 이겼습니다!' : 'AI가 이겼습니다!'}
          </h1>
          <p className="font-mono text-brutal-gray text-sm uppercase tracking-wider">
            Quest #03 &mdash; 사업 제안서 작성
          </p>
        </motion.div>

        {/* Score Comparison */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <motion.div
            className="border-4 border-human p-8 text-center"
            style={{ background: 'linear-gradient(180deg, rgba(0,102,255,0.1) 0%, transparent 100%)' }}
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="font-mono text-xs uppercase tracking-wider text-human mb-2">HUMAN</div>
            <div className="font-mono font-bold text-6xl md:text-7xl text-human tabular-nums">
              {humanCount}
            </div>
          </motion.div>

          <motion.div
            className="font-display font-bold text-2xl text-brutal-gray"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
          >
            VS
          </motion.div>

          <motion.div
            className="border-4 border-ai p-8 text-center"
            style={{ background: 'linear-gradient(180deg, rgba(255,51,51,0.1) 0%, transparent 100%)' }}
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="font-mono text-xs uppercase tracking-wider text-ai mb-2">AI</div>
            <div className="font-mono font-bold text-6xl md:text-7xl text-ai tabular-nums">
              {aiCount}
            </div>
          </motion.div>
        </div>

        {/* Score Breakdown */}
        <motion.div
          className="border-3 border-brutal-gray p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h3 className="font-display font-bold text-lg uppercase mb-6 flex items-center gap-2">
            <BarChart2 size={20} className="text-brutal-yellow" />
            평가 항목별 점수
          </h3>
          <div className="space-y-5">
            {RESULT.breakdown.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
              >
                <div className="font-display font-bold text-sm uppercase mb-2">{item.label}</div>
                <div className="grid grid-cols-[60px_1fr_60px] gap-3 items-center mb-1">
                  <span className="font-mono font-bold text-human text-right tabular-nums">{item.human}</span>
                  <div className="h-3 bg-brutal-gray/30 relative overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-human"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.human}%` }}
                      transition={{ delay: 1.6 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <span className="font-mono text-xs text-brutal-gray">사람</span>
                </div>
                <div className="grid grid-cols-[60px_1fr_60px] gap-3 items-center">
                  <span className="font-mono font-bold text-ai text-right tabular-nums">{item.ai}</span>
                  <div className="h-3 bg-brutal-gray/30 relative overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-ai"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.ai}%` }}
                      transition={{ delay: 1.6 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <span className="font-mono text-xs text-brutal-gray">AI</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Badges & XP */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Badges */}
          <motion.div
            className="border-3 border-brutal-yellow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <h3 className="font-display font-bold uppercase mb-4 flex items-center gap-2">
              <Star size={18} className="text-brutal-yellow" />
              획득한 배지
            </h3>
            <div className="flex gap-4">
              {RESULT.badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  className="brutal-border-white p-4 text-center flex-1"
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 2.2 + index * 0.2, type: 'spring' }}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className="font-display font-bold text-sm">{badge.name}</div>
                  <div className="font-mono text-xs text-brutal-gray uppercase mt-1">{badge.tier}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* XP */}
          <motion.div
            className="border-3 border-brutal-green p-6 flex flex-col items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2 }}
          >
            <div className="font-mono text-xs uppercase tracking-wider text-brutal-gray mb-2">획득 경험치</div>
            <motion.div
              className="font-mono font-bold text-5xl text-success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2.5, type: 'spring', stiffness: 200 }}
            >
              +{RESULT.xpGained} XP
            </motion.div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          className="flex gap-4 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
        >
          <Link to="/analysis">
            <Button variant="secondary" size="lg" className="border-brutal-white text-brutal-white hover:bg-brutal-white hover:text-brutal-black">
              <BarChart2 size={18} />
              분석 보기
            </Button>
          </Link>
          <Link to="/quests">
            <Button variant="primary" size="lg">
              다음 퀘스트
              <ArrowRight size={18} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
