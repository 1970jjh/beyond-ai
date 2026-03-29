import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Palette, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ScoreAnimation } from '../components/gamification/ScoreAnimation'

type ThemeKey = 'dark' | 'neon' | 'minimal'

const THEMES: Record<ThemeKey, { label: string; bg: string; accent: string; text: string }> = {
  dark: { label: '다크', bg: 'bg-brutal-black', accent: 'text-brutal-yellow', text: 'text-brutal-white' },
  neon: { label: '네온', bg: 'bg-brutal-purple/90', accent: 'text-brutal-green', text: 'text-brutal-white' },
  minimal: { label: '미니멀', bg: 'bg-brutal-white', accent: 'text-brutal-black', text: 'text-brutal-black' },
}

const USER_DATA = {
  name: '김민수',
  totalScore: 987,
  rank: 3,
  humanWins: 8,
  aiWins: 4,
  topSkill: '기획력',
  growthRate: 34,
  badges: 5,
  bestMonth: { month: 3, score: 87 },
} as const

export function InfographicPage() {
  const [theme, setTheme] = useState<ThemeKey>('dark')
  const [generating, setGenerating] = useState(false)
  const currentTheme = THEMES[theme]

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">성과 인포그래픽</h1>
        <p className="text-brutal-gray text-lg">나만의 성장 스토리를 시각화합니다</p>
      </div>

      {/* Theme Selector */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} />
          <span className="font-display font-bold uppercase">테마 선택</span>
        </div>
        <div className="flex gap-3">
          {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={clsx(
                'brutal-border px-4 py-2 font-display font-bold uppercase text-sm cursor-pointer transition-all',
                theme === key
                  ? 'bg-brutal-yellow text-brutal-black shadow-brutal'
                  : 'bg-brutal-light-gray hover:bg-brutal-yellow/20',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Infographic Preview */}
      <motion.div
        className={clsx(
          'brutal-border-thick p-8 md:p-12 shadow-brutal-xl relative overflow-hidden',
          currentTheme.bg, currentTheme.text,
        )}
        layout
        transition={{ duration: 0.3 }}
      >
        {/* Scanline for dark theme */}
        {theme === 'dark' && <div className="absolute inset-0 scanline pointer-events-none" />}

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className={clsx('font-display font-bold text-sm uppercase tracking-wider mb-2', theme === 'dark' ? 'text-brutal-yellow' : 'text-brutal-gray')}>
              BEYOND AI &mdash; 12개월 성장 리포트
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl uppercase mb-2">
              {USER_DATA.name}
            </h2>
            <p className="font-mono text-sm opacity-60">2026.01 &mdash; 2026.12</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="text-center p-4 border-2 border-current/20">
              <div className={clsx('font-mono font-bold text-3xl', currentTheme.accent)}>
                <ScoreAnimation targetScore={USER_DATA.totalScore} />
              </div>
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mt-1">총 점수</div>
            </div>
            <div className="text-center p-4 border-2 border-current/20">
              <div className={clsx('font-mono font-bold text-3xl', currentTheme.accent)}>
                #{USER_DATA.rank}
              </div>
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mt-1">최종 순위</div>
            </div>
            <div className="text-center p-4 border-2 border-current/20">
              <div className={clsx('font-mono font-bold text-3xl', currentTheme.accent)}>
                +{USER_DATA.growthRate}%
              </div>
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mt-1">성장률</div>
            </div>
          </div>

          {/* Battle Record */}
          <div className="mb-10">
            <div className="font-display font-bold text-sm uppercase tracking-wider mb-4 opacity-60">AI와의 대결 전적</div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-sm font-bold text-human">사람 {USER_DATA.humanWins}승</span>
                  <span className="font-mono text-sm font-bold text-ai">AI {USER_DATA.aiWins}승</span>
                </div>
                <div className="h-6 brutal-border bg-ai/30 overflow-hidden flex">
                  <motion.div
                    className="h-full bg-human"
                    initial={{ width: 0 }}
                    animate={{ width: `${(USER_DATA.humanWins / 12) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-4 border-2 border-current/20">
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mb-1">최고 역량</div>
              <div className="font-display font-bold text-xl">{USER_DATA.topSkill}</div>
            </div>
            <div className="p-4 border-2 border-current/20">
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mb-1">최고 성적</div>
              <div className="font-display font-bold text-xl">{USER_DATA.bestMonth.month}월 {USER_DATA.bestMonth.score}점</div>
            </div>
            <div className="p-4 border-2 border-current/20">
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mb-1">획득 배지</div>
              <div className="font-display font-bold text-xl">{USER_DATA.badges}개</div>
            </div>
            <div className="p-4 border-2 border-current/20">
              <div className="font-mono text-xs uppercase tracking-wider opacity-60 mb-1">승률</div>
              <div className="font-display font-bold text-xl">{Math.round((USER_DATA.humanWins / 12) * 100)}%</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t-2 border-current/20">
            <div className={clsx('font-display font-bold text-lg', currentTheme.accent)}>[B] BEYOND AI</div>
            <div className="font-mono text-xs opacity-40 mt-1">사람 vs AI, 12개월의 성장 대결</div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="primary" size="lg" className="flex-1" onClick={handleGenerate}>
          {generating ? (
            <><RefreshCw size={18} className="animate-spin" /> 생성 중...</>
          ) : (
            <><Download size={18} /> 이미지 다운로드</>
          )}
        </Button>
        <Button variant="secondary" size="lg">
          <Share2 size={18} />
          공유하기
        </Button>
      </div>
    </div>
  )
}
