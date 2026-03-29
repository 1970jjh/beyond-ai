import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Award, Star, Target, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ScoreAnimation } from '../components/gamification/ScoreAnimation'

const REPORT = {
  userName: '김민수',
  totalScore: 987,
  rank: 3,
  totalParticipants: 24,
  growthPercentage: 34,
  topSkill: '기획력',
  bestMonth: 3,
  questResults: [
    { month: 1, title: '시장 분석 리포트', human: 82, ai: 78, result: 'human_win' as const },
    { month: 2, title: '고객 페르소나 설계', human: 75, ai: 80, result: 'ai_win' as const },
    { month: 3, title: '사업 제안서 작성', human: 87, ai: 82, result: 'human_win' as const },
    { month: 4, title: '위기 대응 시뮬레이션', human: 79, ai: 85, result: 'ai_win' as const },
    { month: 5, title: '팀 빌딩 챌린지', human: 91, ai: 70, result: 'human_win' as const },
    { month: 6, title: '프레젠테이션 배틀', human: 88, ai: 75, result: 'human_win' as const },
    { month: 7, title: '프로세스 혁신', human: 72, ai: 88, result: 'ai_win' as const },
    { month: 8, title: '고객 응대 롤플레이', human: 90, ai: 68, result: 'human_win' as const },
    { month: 9, title: '데이터 기반 의사결정', human: 76, ai: 89, result: 'ai_win' as const },
    { month: 10, title: '신제품 아이디어톤', human: 85, ai: 77, result: 'human_win' as const },
    { month: 11, title: '갈등 해결 시뮬레이션', human: 83, ai: 79, result: 'human_win' as const },
    { month: 12, title: '연간 성과 발표회', human: 92, ai: 72, result: 'human_win' as const },
  ],
  badges: [
    { id: 'b1', name: 'AI 헌터', icon: '🎯', tier: 'bronze' },
    { id: 'b2', name: '분석의 달인', icon: '📊', tier: 'silver' },
    { id: 'b3', name: '연속 승리', icon: '🔥', tier: 'gold' },
    { id: 'b4', name: '리더십 마스터', icon: '👑', tier: 'platinum' },
    { id: 'b5', name: '퀘스트 컴플리터', icon: '🏆', tier: 'gold' },
  ],
} as const

const humanWins = REPORT.questResults.filter((r) => r.result === 'human_win').length
const aiWins = REPORT.questResults.filter((r) => r.result === 'ai_win').length

export function FinalReportPage() {
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <motion.div
        className="brutal-border-thick bg-brutal-yellow p-8 shadow-brutal-xl text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Trophy size={48} className="mx-auto mb-4" />
        <h1 className="text-4xl md:text-5xl mb-2">최종 리포트</h1>
        <p className="font-display font-bold text-xl">{REPORT.userName}님의 12개월 여정</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Calendar size={16} />
          <span className="font-mono text-sm">2026.01 &mdash; 2026.12</span>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '총 점수', value: REPORT.totalScore, icon: Star, color: 'text-brutal-yellow' },
          { label: '최종 순위', value: REPORT.rank, icon: Trophy, color: 'text-brutal-green', suffix: `/${REPORT.totalParticipants}` },
          { label: '성장률', value: REPORT.growthPercentage, icon: TrendingUp, color: 'text-brutal-purple', suffix: '%' },
          { label: 'AI 전승', value: humanWins, icon: Award, color: 'text-human', suffix: `승 ${aiWins}패` },
        ].map(({ label, value, icon: Icon, color, suffix }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="text-center">
              <Icon className={`mx-auto mb-2 ${color}`} size={24} />
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">{label}</div>
              <div className="font-mono font-bold text-2xl mt-1">
                <ScoreAnimation targetScore={value} />
                {suffix && <span className="text-sm text-brutal-gray ml-1">{suffix}</span>}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 12-Month Timeline */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-6 flex items-center gap-2">
          <Calendar size={20} />
          12개월 퀘스트 기록
        </h3>
        <div className="space-y-3">
          {REPORT.questResults.map((quest, index) => (
            <motion.div
              key={quest.month}
              className="brutal-border p-4 bg-brutal-light-gray"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xl w-8 text-center">
                    {String(quest.month).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="font-display font-bold text-sm">{quest.title}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-human">{quest.human}</span>
                  <span className="text-brutal-gray text-xs">vs</span>
                  <span className="font-mono font-bold text-sm text-ai">{quest.ai}</span>
                  <span className={clsx(
                    'brutal-border px-2 py-0.5 font-mono font-bold text-xs uppercase',
                    quest.result === 'human_win'
                      ? 'bg-human text-brutal-white border-human'
                      : 'bg-ai text-brutal-white border-ai',
                  )}>
                    {quest.result === 'human_win' ? 'WIN' : 'LOSE'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-2 bg-brutal-white brutal-border overflow-hidden">
                  <motion.div
                    className="h-full bg-human"
                    initial={{ width: 0 }}
                    animate={{ width: `${quest.human}%` }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                  />
                </div>
                <div className="h-2 bg-brutal-white brutal-border overflow-hidden">
                  <motion.div
                    className="h-full bg-ai"
                    initial={{ width: 0 }}
                    animate={{ width: `${quest.ai}%` }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Win/Loss Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display font-bold uppercase mb-4">사람 vs AI 전적</h3>
          <ProgressBar value={humanWins} max={12} variant="human" label={`사람 ${humanWins}승`} />
          <div className="mt-3">
            <ProgressBar value={aiWins} max={12} variant="ai" label={`AI ${aiWins}승`} />
          </div>
        </Card>

        <Card>
          <h3 className="font-display font-bold uppercase mb-4">최고 역량</h3>
          <div className="text-center py-4">
            <Target size={32} className="mx-auto mb-2 text-brutal-yellow" />
            <div className="font-display font-bold text-2xl">{REPORT.topSkill}</div>
            <div className="font-mono text-sm text-brutal-gray mt-1">
              최고 점수: {REPORT.questResults[REPORT.bestMonth - 1].human}점 ({REPORT.bestMonth}월)
            </div>
          </div>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-4 flex items-center gap-2">
          <Award size={20} />
          획득한 배지 ({REPORT.badges.length}개)
        </h3>
        <div className="flex flex-wrap gap-4">
          {REPORT.badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              className={clsx(
                'brutal-border p-4 text-center min-w-[100px]',
                badge.tier === 'platinum' ? 'bg-brutal-purple/10 border-brutal-purple' :
                badge.tier === 'gold' ? 'bg-brutal-yellow/20 border-brutal-yellow' :
                badge.tier === 'silver' ? 'bg-brutal-gray/10' :
                'bg-brutal-orange/10 border-brutal-orange',
              )}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.8 + index * 0.1, type: 'spring' }}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <div className="font-display font-bold text-xs">{badge.name}</div>
              <div className="font-mono text-[10px] text-brutal-gray uppercase">{badge.tier}</div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
