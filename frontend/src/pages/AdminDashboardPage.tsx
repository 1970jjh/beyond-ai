import { useState } from 'react'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Users, BarChart3, Activity, Zap, Copy, Check,
  Eye, Wifi, WifiOff
} from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { GameTimer } from '../components/shared/GameTimer'
import { useGameStore, SUDDEN_EVENTS } from '../stores/gameStore'
import { useUIStore } from '../stores/uiStore'

type TabKey = 'monitor' | 'events' | 'results'

const MOCK_TEAMS = [
  {
    id: 't1', name: 'Alpha', color: '#0055FF',
    members: [
      { id: 'u1', name: '김민수', role: '리더', online: true },
      { id: 'u2', name: '이지은', role: '연구원', online: true },
      { id: 'u3', name: '박준호', role: '발표자', online: true },
      { id: 'u4', name: '최서연', role: '분석가', online: false },
    ],
    progress: 72,
    score: 245,
  },
  {
    id: 't2', name: 'Beta', color: '#8B5CF6',
    members: [
      { id: 'u5', name: '정우진', role: '리더', online: true },
      { id: 'u6', name: '한소희', role: '연구원', online: true },
      { id: 'u7', name: '오민지', role: '분석가', online: true },
      { id: 'u8', name: '장현우', role: '발표자', online: true },
    ],
    progress: 85,
    score: 310,
  },
  {
    id: 't3', name: 'Gamma', color: '#00CC66',
    members: [
      { id: 'u9', name: '서유리', role: '리더', online: true },
      { id: 'u10', name: '윤준서', role: '연구원', online: false },
      { id: 'u11', name: '강하늘', role: '발표자', online: true },
      { id: 'u12', name: '임수빈', role: '분석가', online: true },
    ],
    progress: 58,
    score: 198,
  },
  {
    id: 't4', name: 'Delta', color: '#FF6600',
    members: [
      { id: 'u13', name: '배민호', role: '리더', online: true },
      { id: 'u14', name: '조은서', role: '연구원', online: true },
      { id: 'u15', name: '문재현', role: '발표자', online: true },
      { id: 'u16', name: '신지아', role: '분석가', online: true },
    ],
    progress: 91,
    score: 340,
  },
]

const ROOM_CODE = 'X7K2M9'

export function AdminDashboardPage() {
  const [tab, setTab] = useState<TabKey>('monitor')
  const [copied, setCopied] = useState(false)
  const { triggerEvent } = useGameStore()
  const { addToast } = useUIStore()

  const totalOnline = MOCK_TEAMS.reduce((sum, t) => sum + t.members.filter((m) => m.online).length, 0)
  const totalMembers = MOCK_TEAMS.reduce((sum, t) => sum + t.members.length, 0)

  const handleCopy = () => {
    navigator.clipboard.writeText(ROOM_CODE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTriggerEvent = (index: number) => {
    const event = SUDDEN_EVENTS[index]
    triggerEvent(event)
    addToast(`이벤트 발동: ${event.title}`, 'warning')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl mb-1">관리자 콘솔</h1>
          <p className="text-brutal-gray text-lg">실시간 모니터링 및 제어</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-brutal-green animate-pulse" />
          <span className="font-mono text-sm text-brutal-green font-bold">{totalOnline}/{totalMembers} 접속</span>
        </div>
      </div>

      {/* Top Row: Room Code + QR + Timer */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Room Code & QR */}
        <Card variant="highlight" className="text-center">
          <p className="font-display font-bold text-xs uppercase tracking-wider mb-3">방 코드</p>
          <div className="font-mono font-bold text-4xl tracking-[0.3em] mb-4">{ROOM_CODE}</div>
          <div className="flex justify-center mb-4">
            <div className="brutal-border bg-brutal-white p-3">
              <QRCodeSVG
                value={`${window.location.origin}/join?code=${ROOM_CODE}`}
                size={140}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '복사됨' : '코드 복사'}
          </Button>
        </Card>

        {/* Timer */}
        <Card className="flex flex-col items-center justify-center">
          <GameTimer size="lg" showControls />
        </Card>

        {/* Quick Stats */}
        <Card>
          <h3 className="font-display font-bold text-sm uppercase mb-4">실시간 현황</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between brutal-border p-3 bg-brutal-light-gray">
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span className="font-display font-bold text-sm">참가자</span>
              </div>
              <span className="font-mono font-bold text-lg">{totalOnline}/{totalMembers}</span>
            </div>
            <div className="flex items-center justify-between brutal-border p-3 bg-brutal-light-gray">
              <div className="flex items-center gap-2">
                <Activity size={16} />
                <span className="font-display font-bold text-sm">평균 진행률</span>
              </div>
              <span className="font-mono font-bold text-lg">
                {Math.round(MOCK_TEAMS.reduce((s, t) => s + t.progress, 0) / MOCK_TEAMS.length)}%
              </span>
            </div>
            <div className="flex items-center justify-between brutal-border p-3 bg-brutal-light-gray">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} />
                <span className="font-display font-bold text-sm">선두 팀</span>
              </div>
              <span className="font-mono font-bold text-lg">
                {[...MOCK_TEAMS].sort((a, b) => b.score - a.score)[0].name}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {([
          { key: 'monitor' as TabKey, label: '팀 모니터링', icon: Eye },
          { key: 'events' as TabKey, label: '이벤트 발동', icon: Zap },
          { key: 'results' as TabKey, label: '성과 분석', icon: BarChart3 },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'brutal-border px-4 py-2 font-display font-bold text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2',
              tab === key
                ? 'bg-brutal-yellow text-brutal-black shadow-brutal'
                : 'bg-brutal-white hover:bg-brutal-light-gray',
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'monitor' && (
        <div className="grid md:grid-cols-2 gap-6">
          {MOCK_TEAMS.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 brutal-border"
                      style={{ backgroundColor: team.color }}
                    />
                    <h3 className="font-display font-bold text-lg uppercase">팀 {team.name}</h3>
                  </div>
                  <span className="font-mono font-bold text-xl">{team.score}점</span>
                </div>

                <ProgressBar value={team.progress} variant="default" label="진행률" className="mb-4" />

                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 brutal-border p-2 bg-brutal-light-gray"
                    >
                      <span className={clsx(
                        'w-2 h-2 rounded-full',
                        member.online ? 'bg-brutal-green' : 'bg-brutal-red',
                      )} />
                      {member.online ? <Wifi size={12} className="text-brutal-green" /> : <WifiOff size={12} className="text-brutal-red" />}
                      <span className="font-bold text-sm flex-1">{member.name}</span>
                      <span className="font-mono text-xs text-brutal-gray uppercase">{member.role}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SUDDEN_EVENTS.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="text-center cursor-pointer hover:bg-brutal-yellow/10"
                onClick={() => handleTriggerEvent(index)}
              >
                <Zap size={24} className="mx-auto mb-2 text-brutal-orange" />
                <div className="font-display font-bold text-sm mb-1">{event.title}</div>
                <p className="text-xs text-brutal-gray">{event.description}</p>
                {event.duration > 0 && (
                  <div className="font-mono text-xs text-brutal-gray mt-2">{event.duration}초</div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'results' && (
        <div className="space-y-6">
          {/* Team Rankings */}
          <Card>
            <h3 className="font-display font-bold text-lg uppercase mb-4">팀 순위</h3>
            <div className="space-y-3">
              {[...MOCK_TEAMS]
                .sort((a, b) => b.score - a.score)
                .map((team, index) => (
                  <motion.div
                    key={team.id}
                    className="flex items-center gap-4 brutal-border p-4 bg-brutal-light-gray"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="font-display font-bold text-2xl w-8 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </span>
                    <div
                      className="w-4 h-4 brutal-border"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-display font-bold text-lg flex-1">팀 {team.name}</span>
                    <ProgressBar value={team.progress} className="w-32" showValue={false} />
                    <span className="font-mono font-bold text-xl">{team.score}점</span>
                  </motion.div>
                ))}
            </div>
          </Card>

          {/* Score Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-display font-bold uppercase mb-4">사람 vs AI 현황</h3>
              <ProgressBar value={68} variant="human" label="사람 평균" className="mb-3" />
              <ProgressBar value={75} variant="ai" label="AI 평균" />
            </Card>
            <Card>
              <h3 className="font-display font-bold uppercase mb-4">참여 통계</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="brutal-border p-3 bg-brutal-light-gray text-center">
                  <div className="font-mono text-xs text-brutal-gray uppercase">총 제출</div>
                  <div className="font-mono font-bold text-2xl">{totalOnline}</div>
                </div>
                <div className="brutal-border p-3 bg-brutal-light-gray text-center">
                  <div className="font-mono text-xs text-brutal-gray uppercase">힌트 사용</div>
                  <div className="font-mono font-bold text-2xl">7</div>
                </div>
                <div className="brutal-border p-3 bg-brutal-light-gray text-center">
                  <div className="font-mono text-xs text-brutal-gray uppercase">이벤트 발동</div>
                  <div className="font-mono font-bold text-2xl">3</div>
                </div>
                <div className="brutal-border p-3 bg-brutal-light-gray text-center">
                  <div className="font-mono text-xs text-brutal-gray uppercase">평균 시간</div>
                  <div className="font-mono font-bold text-2xl">22분</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
