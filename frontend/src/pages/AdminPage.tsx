import { motion } from 'framer-motion'
import { Users, BarChart3, Settings, Activity } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { MOCK_DASHBOARD } from '../utils/mockData'

const MOCK_LEARNERS = [
  { id: 'u1', name: '김민수', team: 'Alpha', progress: 85, status: 'active' as const },
  { id: 'u2', name: '이지은', team: 'Beta', progress: 72, status: 'active' as const },
  { id: 'u3', name: '박준호', team: 'Alpha', progress: 68, status: 'active' as const },
  { id: 'u4', name: '최서연', team: 'Gamma', progress: 45, status: 'at_risk' as const },
  { id: 'u5', name: '정우진', team: 'Beta', progress: 30, status: 'inactive' as const },
]

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: '활발', color: 'bg-brutal-green text-brutal-white' },
  at_risk: { label: '주의', color: 'bg-brutal-orange text-brutal-white' },
  inactive: { label: '비활성', color: 'bg-brutal-red text-brutal-white' },
}

export function AdminPage() {
  const stats = MOCK_DASHBOARD

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">관리자 대시보드</h1>
        <p className="text-brutal-gray text-lg">학습 현황 및 프로그램 관리</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: '총 참가자', value: '24명' },
          { icon: Activity, label: '활성 비율', value: '83%' },
          { icon: BarChart3, label: '평균 진행률', value: '65%' },
          { icon: Settings, label: '현재 퀘스트', value: '3월' },
        ].map(({ icon: Icon, label, value }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="text-center">
              <Icon className="mx-auto mb-2 text-brutal-purple" size={24} />
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">{label}</div>
              <div className="font-mono font-bold text-2xl mt-1">{value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Program Progress */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-4">프로그램 진행 현황</h3>
        <ProgressBar
          value={stats.completedQuests}
          max={stats.totalQuests}
          variant="default"
          label={`${stats.completedQuests}/${stats.totalQuests} 퀘스트 완료`}
        />
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="brutal-border p-3 bg-human/10">
            <div className="font-display font-bold text-xs uppercase text-brutal-gray">사람 승</div>
            <div className="font-mono font-bold text-xl text-human">{stats.humanWins}</div>
          </div>
          <div className="brutal-border p-3 bg-draw/10">
            <div className="font-display font-bold text-xs uppercase text-brutal-gray">무승부</div>
            <div className="font-mono font-bold text-xl text-draw">{stats.draws}</div>
          </div>
          <div className="brutal-border p-3 bg-ai/10">
            <div className="font-display font-bold text-xs uppercase text-brutal-gray">AI 승</div>
            <div className="font-mono font-bold text-xl text-ai">{stats.aiWins}</div>
          </div>
        </div>
      </Card>

      {/* Learner Status */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-4">학습자 현황</h3>
        <div className="space-y-3">
          {MOCK_LEARNERS.map((learner, index) => {
            const status = statusLabels[learner.status]
            return (
              <motion.div
                key={learner.id}
                className="brutal-border p-4 bg-brutal-light-gray"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{learner.name}</span>
                    <span className="text-sm text-brutal-gray">팀 {learner.team}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-bold ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <ProgressBar
                  value={learner.progress}
                  variant={learner.status === 'at_risk' ? 'ai' : learner.status === 'inactive' ? 'ai' : 'human'}
                  showValue
                />
              </motion.div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
