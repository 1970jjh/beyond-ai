import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Users, Clock, Target, Copy, Check } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useRoomStore } from '../stores/roomStore'

const QUESTS = [
  { id: 'q1', month: 1, title: '시장 분석 리포트' },
  { id: 'q2', month: 2, title: '고객 페르소나 설계' },
  { id: 'q3', month: 3, title: '사업 제안서 작성' },
  { id: 'q4', month: 4, title: '위기 대응 시뮬레이션' },
  { id: 'q5', month: 5, title: '팀 빌딩 챌린지' },
  { id: 'q6', month: 6, title: '프레젠테이션 배틀' },
  { id: 'q7', month: 7, title: '프로세스 혁신' },
  { id: 'q8', month: 8, title: '고객 응대 롤플레이' },
  { id: 'q9', month: 9, title: '데이터 기반 의사결정' },
  { id: 'q10', month: 10, title: '신제품 아이디어톤' },
  { id: 'q11', month: 11, title: '갈등 해결 시뮬레이션' },
  { id: 'q12', month: 12, title: '연간 성과 발표회' },
] as const

const TEAM_OPTIONS = [2, 3, 4, 6] as const
const MEMBER_OPTIONS = [3, 4, 5, 6] as const
const TIME_OPTIONS = [
  { value: 15, label: '15분' },
  { value: 30, label: '30분' },
  { value: 45, label: '45분' },
  { value: 60, label: '60분' },
] as const

interface FormState {
  readonly roomName: string
  readonly teamCount: number
  readonly maxMembers: number
  readonly selectedQuest: string | null
  readonly timeLimit: number
}

export function RoomCreatePage() {
  const createRoom = useRoomStore((s) => s.createRoom)
  const currentRoom = useRoomStore((s) => s.currentRoom)
  const isLoading = useRoomStore((s) => s.isLoading)

  const [form, setForm] = useState<FormState>({
    roomName: '',
    teamCount: 4,
    maxMembers: 4,
    selectedQuest: null,
    timeLimit: 30,
  })
  const [created, setCreated] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    const room = await createRoom({
      name: form.roomName,
      industryType: form.selectedQuest ?? '',
      teamCount: form.teamCount,
      maxMembersPerTeam: form.maxMembers,
    })
    if (room) {
      setCreated(true)
    }
  }

  const handleCopy = () => {
    if (!currentRoom) return
    navigator.clipboard.writeText(currentRoom.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isValid = form.roomName.trim() !== '' && form.selectedQuest !== null

  if (created && currentRoom) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl mb-1">방 개설 완료</h1>
          <p className="text-brutal-gray text-lg">학습자에게 아래 코드를 공유하세요</p>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card variant="highlight" className="text-center py-12">
            <p className="font-display font-bold text-sm uppercase tracking-wider mb-4">방 코드</p>
            <div className="font-mono font-bold text-6xl tracking-[0.3em] mb-6">{currentRoom.code}</div>
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? '복사됨' : '코드 복사'}
            </Button>
          </Card>
        </motion.div>

        <Card>
          <h3 className="font-display font-bold text-lg uppercase mb-4">방 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="brutal-border p-3 bg-brutal-light-gray text-center">
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">방 이름</div>
              <div className="font-bold mt-1">{currentRoom.name}</div>
            </div>
            <div className="brutal-border p-3 bg-brutal-light-gray text-center">
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">팀 수</div>
              <div className="font-mono font-bold text-xl mt-1">{currentRoom.teamCount}</div>
            </div>
            <div className="brutal-border p-3 bg-brutal-light-gray text-center">
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">팀당 인원</div>
              <div className="font-mono font-bold text-xl mt-1">{currentRoom.maxMembersPerTeam}</div>
            </div>
            <div className="brutal-border p-3 bg-brutal-light-gray text-center">
              <div className="font-display font-bold text-xs uppercase text-brutal-gray">제한 시간</div>
              <div className="font-mono font-bold text-xl mt-1">{form.timeLimit}분</div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">방 개설</h1>
        <p className="text-brutal-gray text-lg">새로운 대결 방을 개설합니다</p>
      </div>

      {/* Room Name */}
      <Card>
        <label className="block">
          <span className="font-mono font-bold text-xs uppercase tracking-wider text-brutal-gray block mb-2">방 이름</span>
          <input
            type="text"
            value={form.roomName}
            onChange={(e) => setForm({ ...form, roomName: e.target.value })}
            placeholder="예: 3월 마케팅팀 대결"
            className="w-full brutal-border p-4 font-bold text-lg bg-brutal-light-gray outline-none focus:border-brutal-yellow"
          />
        </label>
      </Card>

      {/* Team & Member Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} />
            <span className="font-display font-bold uppercase">팀 수</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TEAM_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setForm({ ...form, teamCount: count })}
                className={clsx(
                  'brutal-border p-3 font-mono font-bold text-xl text-center cursor-pointer transition-all',
                  form.teamCount === count
                    ? 'bg-brutal-yellow text-brutal-black shadow-brutal'
                    : 'bg-brutal-light-gray hover:bg-brutal-yellow/30',
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} />
            <span className="font-display font-bold uppercase">팀당 인원</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MEMBER_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setForm({ ...form, maxMembers: count })}
                className={clsx(
                  'brutal-border p-3 font-mono font-bold text-xl text-center cursor-pointer transition-all',
                  form.maxMembers === count
                    ? 'bg-brutal-yellow text-brutal-black shadow-brutal'
                    : 'bg-brutal-light-gray hover:bg-brutal-yellow/30',
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Time Limit */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} />
          <span className="font-display font-bold uppercase">제한 시간</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TIME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setForm({ ...form, timeLimit: value })}
              className={clsx(
                'brutal-border p-3 font-display font-bold text-center cursor-pointer transition-all',
                form.timeLimit === value
                  ? 'bg-brutal-yellow text-brutal-black shadow-brutal'
                  : 'bg-brutal-light-gray hover:bg-brutal-yellow/30',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Quest Selection */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Target size={20} />
          <span className="font-display font-bold uppercase">퀘스트 선택</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUESTS.map((quest) => (
            <motion.button
              key={quest.id}
              onClick={() => setForm({ ...form, selectedQuest: quest.id })}
              className={clsx(
                'brutal-border p-4 text-left cursor-pointer transition-all',
                form.selectedQuest === quest.id
                  ? 'bg-brutal-yellow text-brutal-black shadow-brutal'
                  : 'bg-brutal-light-gray hover:bg-brutal-yellow/20',
              )}
              whileHover={{ y: -2 }}
            >
              <div className="font-mono font-bold text-2xl mb-1">{String(quest.month).padStart(2, '0')}</div>
              <div className="font-display font-bold text-sm">{quest.title}</div>
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Create Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!isValid || isLoading}
          onClick={handleCreate}
        >
          <Plus size={20} />
          {isLoading ? '생성 중...' : '방 개설하기'}
        </Button>
      </motion.div>
    </div>
  )
}
