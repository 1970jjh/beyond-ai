import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Award, Flame, Brain, Target } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ScoreAnimation } from '../components/gamification/ScoreAnimation'
import { BadgeShowcase } from '../components/gamification/BadgeShowcase'
import { MOCK_BADGES } from '../utils/mockData'

const SKILL_RADAR = [
  { skill: '데이터 분석', human: 82, ai: 78 },
  { skill: '고객 이해', human: 75, ai: 80 },
  { skill: '기획력', human: 87, ai: 82 },
  { skill: '문제 해결', human: 70, ai: 85 },
  { skill: '리더십', human: 88, ai: 65 },
  { skill: '커뮤니케이션', human: 90, ai: 72 },
] as const

const MONTHLY_DATA = [
  { month: 1, title: '시장 분석', human: 82, ai: 78, result: 'human_win' as const },
  { month: 2, title: '페르소나 설계', human: 75, ai: 80, result: 'ai_win' as const },
  { month: 3, title: '사업 제안서', human: 87, ai: 82, result: 'human_win' as const },
] as const

export function AnalysisPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">분석 대시보드</h1>
        <p className="text-brutal-gray text-lg">나의 성장과 AI와의 대결 기록을 분석합니다</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: '성장률', value: 23, suffix: '%', color: 'text-brutal-green' },
          { icon: Award, label: '획득 배지', value: 3, suffix: '개', color: 'text-brutal-yellow' },
          { icon: Flame, label: '연속 참여', value: 42, suffix: '일', color: 'text-brutal-orange' },
          { icon: Brain, label: '최고 역량', value: 0, suffix: '기획력', color: 'text-brutal-purple' },
        ].map(({ icon: Icon, label, value, suffix, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="text-center">
              <Icon className={`mx-auto mb-2 ${color}`} size={24} />
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">{label}</div>
              <div className="font-mono font-bold text-2xl mt-1">
                {value > 0 ? <ScoreAnimation targetScore={value} /> : ''}
                {suffix}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Skill Comparison Radar (bar-based) */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-6 flex items-center gap-2">
          <Target size={20} />
          역량별 사람 vs AI 비교
        </h3>
        <div className="space-y-4">
          {SKILL_RADAR.map((skill, index) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
            >
              <div className="font-display font-bold text-sm mb-2">{skill.skill}</div>
              <div className="space-y-1">
                <ProgressBar value={skill.human} variant="human" label="사람" showValue />
                <ProgressBar value={skill.ai} variant="ai" label="AI" showValue />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Monthly Results */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-6 flex items-center gap-2">
          <BarChart2 size={20} />
          월별 대결 기록
        </h3>
        <div className="space-y-3">
          {MONTHLY_DATA.map((data, index) => (
            <motion.div
              key={data.month}
              className="brutal-border p-4 bg-brutal-light-gray"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-2xl w-10">{String(data.month).padStart(2, '0')}</span>
                  <div>
                    <div className="font-display font-bold">{data.title}</div>
                    <div className="text-xs text-brutal-gray">{data.month}월 퀘스트</div>
                  </div>
                </div>
                <span className={`brutal-border px-3 py-1 font-mono font-bold text-xs uppercase ${
                  data.result === 'human_win'
                    ? 'bg-human text-brutal-white border-human'
                    : 'bg-ai text-brutal-white border-ai'
                }`}>
                  {data.result === 'human_win' ? '사람 승' : 'AI 승'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-brutal-gray mb-1">사람</div>
                  <div className="h-4 bg-brutal-white brutal-border overflow-hidden">
                    <motion.div
                      className="h-full bg-human"
                      initial={{ width: 0 }}
                      animate={{ width: `${data.human}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    />
                  </div>
                  <div className="font-mono font-bold text-sm text-human mt-1">{data.human}</div>
                </div>
                <div>
                  <div className="text-xs text-brutal-gray mb-1">AI</div>
                  <div className="h-4 bg-brutal-white brutal-border overflow-hidden">
                    <motion.div
                      className="h-full bg-ai"
                      initial={{ width: 0 }}
                      animate={{ width: `${data.ai}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    />
                  </div>
                  <div className="font-mono font-bold text-sm text-ai mt-1">{data.ai}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Badges */}
      <BadgeShowcase badges={MOCK_BADGES} title="획득한 배지" />
    </div>
  )
}
