import { motion } from 'framer-motion'
import { Trophy, Swords, Target, TrendingUp } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { ScoreAnimation } from '../components/gamification/ScoreAnimation'
import { BadgeShowcase } from '../components/gamification/BadgeShowcase'
import { ProgressBar } from '../components/ui/ProgressBar'
import { MOCK_DASHBOARD, MOCK_BADGES, QUESTS } from '../utils/mockData'

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
  const stats = MOCK_DASHBOARD
  const activeQuest = QUESTS.find((q) => q.status === 'active')

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl md:text-5xl mb-2">BEYOND AI</h1>
        <p className="text-brutal-gray text-lg">사람 vs AI &mdash; 12개월 퀘스트 프로그램</p>
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
            <span className="font-display font-bold text-sm uppercase">현재 진행 중인 퀘스트</span>
          </div>
          <h2 className="text-2xl mb-1">{activeQuest.month}월 &mdash; {activeQuest.title}</h2>
          <p className="text-brutal-gray">{activeQuest.description}</p>
          <div className="mt-4">
            <ProgressBar value={65} label="진행률" variant="default" />
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="완료 퀘스트" value={stats.completedQuests} color="text-brutal-green" />
        <StatCard icon={Trophy} label="사람 승리" value={stats.humanWins} color="text-human" />
        <StatCard icon={Swords} label="AI 승리" value={stats.aiWins} color="text-ai" />
        <StatCard icon={TrendingUp} label="평균 점수" value={Math.round(stats.averageHumanScore)} color="text-brutal-purple" />
      </div>

      {/* Score Comparison */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-4">사람 vs AI 평균 점수</h3>
        <div className="space-y-3">
          <ProgressBar value={stats.averageHumanScore} variant="human" label="사람 팀" />
          <ProgressBar value={stats.averageAiScore} variant="ai" label="AI" />
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges */}
        <BadgeShowcase badges={MOCK_BADGES} />

        {/* Top Performers */}
        <Card>
          <h3 className="font-display font-bold text-lg uppercase mb-4">상위 성과자</h3>
          <div className="space-y-3">
            {stats.topPerformers.map((performer, index) => (
              <div
                key={performer.userId}
                className="flex items-center gap-3 brutal-border p-3 bg-brutal-light-gray"
              >
                <span className="font-display font-bold text-2xl w-8 text-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <span className="font-bold">{performer.name}</span>
                </div>
                <span className="font-mono font-bold text-lg">{performer.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
