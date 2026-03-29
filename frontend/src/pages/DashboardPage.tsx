import { motion } from 'framer-motion'
import { Trophy, Swords, Target, TrendingUp, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { ScoreAnimation } from '../components/gamification/ScoreAnimation'
import { BadgeShowcase } from '../components/gamification/BadgeShowcase'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../stores/authStore'
import { QUEST_CONFIGS } from '../data/quests'

interface QuestResultSaved {
  readonly questId: string
  readonly month: number
  readonly title: string
  readonly humanScore: number
  readonly aiScore: number
  readonly winner: 'human' | 'ai' | 'draw'
  readonly completedAt: string
}

function getResults(): ReadonlyArray<QuestResultSaved> {
  try {
    return JSON.parse(localStorage.getItem('beyond-ai-results') || '[]')
  } catch { return [] }
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  readonly icon: typeof Trophy
  readonly label: string
  readonly value: number
  readonly color: string
}) {
  return (
    <Card className="text-center">
      <Icon className={`mx-auto mb-2 ${color}`} size={28} />
      <div className="font-display font-bold text-sm uppercase text-brutal-gray mb-1">{label}</div>
      <div className="font-mono font-bold text-3xl">
        <ScoreAnimation targetScore={value} />
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const results = getResults()

  const completedCount = results.length
  const humanWins = results.filter(r => r.winner === 'human').length
  const aiWins = results.filter(r => r.winner === 'ai').length
  const avgHumanScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.humanScore, 0) / results.length / 4)
    : 0
  const avgAiScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.aiScore, 0) / results.length / 4)
    : 0

  const currentMonth = new Date().getMonth() + 1
  const activeQuest = QUEST_CONFIGS.find(q => q.month === currentMonth)
  const badges = user?.badges || []

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl md:text-5xl mb-2">BEYOND AI</h1>
        <p className="text-brutal-gray text-lg">
          {user ? `환영합니다, ${user.name}님!` : '사람 vs AI \u2014 12개월 퀘스트 프로그램'}
        </p>
      </motion.div>

      {/* Active Quest Banner */}
      {activeQuest && (
        <motion.div
          className="brutal-border-thick bg-brutal-yellow p-6 shadow-brutal-lg"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-brutal-black" size={24} />
            <span className="font-display font-bold text-sm uppercase">이번 달 퀘스트</span>
          </div>
          <h2 className="text-2xl mb-1">{activeQuest.month}월 &mdash; {activeQuest.icon} {activeQuest.title}</h2>
          <p className="text-brutal-gray mb-4">{activeQuest.description}</p>
          <div className="flex items-center gap-3">
            <ProgressBar value={Math.round(completedCount / 12 * 100)} label="전체 진행률" variant="default" />
            <Button variant="primary" onClick={() => navigate(`/battle/${activeQuest.id}`)}>
              <Play size={16} />
              도전
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="완료 퀘스트" value={completedCount} color="text-brutal-green" />
        <StatCard icon={Trophy} label="사람 승리" value={humanWins} color="text-human" />
        <StatCard icon={Swords} label="AI 승리" value={aiWins} color="text-ai" />
        <StatCard icon={TrendingUp} label="총 점수" value={user?.totalScore || 0} color="text-brutal-purple" />
      </div>

      {/* Score Comparison */}
      {results.length > 0 && (
        <Card>
          <h3 className="font-display font-bold text-lg uppercase mb-4">사람 vs AI 평균 점수</h3>
          <div className="space-y-3">
            <ProgressBar value={avgHumanScore} variant="human" label="사람 팀" />
            <ProgressBar value={avgAiScore} variant="ai" label="AI" />
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges */}
        <BadgeShowcase badges={badges.map(b => ({
          id: b.id,
          name: b.name,
          description: '',
          icon: b.icon,
          earnedAt: new Date().toISOString(),
          tier: b.tier as 'bronze' | 'silver' | 'gold' | 'platinum',
        }))} />

        {/* Recent Results */}
        <Card>
          <h3 className="font-display font-bold text-lg uppercase mb-4">최근 대결 기록</h3>
          {results.length === 0 ? (
            <div className="text-center text-brutal-gray py-8">
              <Swords className="mx-auto mb-3" size={32} />
              <p>아직 대결 기록이 없습니다</p>
              <Button variant="primary" className="mt-4" onClick={() => navigate('/battle')}>
                첫 대결 시작
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.slice(-5).reverse().map((r) => (
                <div key={r.questId + r.completedAt} className="flex items-center gap-3 brutal-border p-3 bg-brutal-light-gray">
                  <span className="font-mono font-bold w-8">{String(r.month).padStart(2, '0')}</span>
                  <div className="flex-1">
                    <span className="font-bold text-sm">{r.title}</span>
                  </div>
                  <span className={`font-mono font-bold text-xs px-2 py-1 brutal-border ${
                    r.winner === 'human' ? 'bg-human text-brutal-white' : r.winner === 'ai' ? 'bg-ai text-brutal-white' : 'bg-brutal-yellow'
                  }`}>
                    {r.winner === 'human' ? '승' : r.winner === 'ai' ? '패' : '무'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
