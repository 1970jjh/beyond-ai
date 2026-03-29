import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Search, Mic, BarChart2, Users, Check } from 'lucide-react'
import clsx from 'clsx'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

type TeamRole = 'leader' | 'researcher' | 'presenter' | 'analyst'

interface Member {
  readonly id: string
  readonly name: string
  readonly role: TeamRole | null
  readonly joined: boolean
}

interface TeamData {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly borderColor: string
  readonly members: ReadonlyArray<Member>
}

const ROLE_CONFIG: Record<TeamRole, { label: string; icon: typeof Shield; description: string }> = {
  leader: { label: '리더', icon: Shield, description: '팀을 이끌고 최종 결정' },
  researcher: { label: '연구원', icon: Search, description: '자료 조사와 분석 담당' },
  presenter: { label: '발표자', icon: Mic, description: '결과물 발표와 전달' },
  analyst: { label: '분석가', icon: BarChart2, description: '데이터 해석과 인사이트' },
}

const INITIAL_TEAMS: ReadonlyArray<TeamData> = [
  {
    id: 't1', name: 'Alpha', color: 'bg-human/10', borderColor: 'border-human',
    members: [
      { id: 'u1', name: '김민수', role: 'leader', joined: true },
      { id: 'u2', name: '이지은', role: null, joined: false },
      { id: 'u3', name: '박준호', role: 'researcher', joined: true },
      { id: 'u4', name: '최서연', role: null, joined: false },
    ],
  },
  {
    id: 't2', name: 'Beta', color: 'bg-brutal-purple/10', borderColor: 'border-brutal-purple',
    members: [
      { id: 'u5', name: '정우진', role: 'leader', joined: true },
      { id: 'u6', name: '한소희', role: null, joined: false },
      { id: 'u7', name: '오민지', role: 'analyst', joined: true },
      { id: 'u8', name: '장현우', role: null, joined: false },
    ],
  },
]

export function TeamFormationPage() {
  const [teams, setTeams] = useState(INITIAL_TEAMS)

  const updateMemberRole = (teamId: string, memberId: string, role: TeamRole) => {
    setTeams(teams.map((team) =>
      team.id === teamId
        ? {
            ...team,
            members: team.members.map((m) =>
              m.id === memberId ? { ...m, role } : m,
            ),
          }
        : team,
    ))
  }

  const isTeamReady = (team: TeamData) =>
    team.members.every((m) => m.role !== null)

  const allReady = teams.every(isTeamReady)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">팀 편성</h1>
        <p className="text-brutal-gray text-lg">역할을 선택하고 팀을 완성하세요</p>
      </div>

      {/* Team Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {teams.map((team, teamIndex) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: teamIndex * 0.15 }}
          >
            <Card className={clsx(team.color, team.borderColor)}>
              {/* Team Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users size={20} />
                  <h3 className="font-display font-bold text-xl uppercase">팀 {team.name}</h3>
                </div>
                {isTeamReady(team) && (
                  <motion.span
                    className="brutal-border bg-brutal-green text-brutal-white px-3 py-1 font-mono font-bold text-xs uppercase flex items-center gap-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <Check size={14} />
                    준비 완료
                  </motion.span>
                )}
              </div>

              {/* Members */}
              <div className="space-y-3">
                {team.members.map((member, memberIndex) => (
                  <motion.div
                    key={member.id}
                    className="brutal-border bg-brutal-white p-4 flex items-center gap-4"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: teamIndex * 0.15 + memberIndex * 0.08 }}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 brutal-border bg-brutal-light-gray flex items-center justify-center font-display font-bold text-sm">
                      {member.name.charAt(0)}
                    </div>

                    {/* Name & Status */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{member.name}</span>
                        <span
                          className={clsx(
                            'w-2 h-2 rounded-full',
                            member.joined ? 'bg-brutal-green' : 'bg-brutal-yellow animate-pulse',
                          )}
                        />
                        <span className="text-xs text-brutal-gray">
                          {member.joined ? '참여 중' : '대기 중'}
                        </span>
                      </div>
                    </div>

                    {/* Role Selector */}
                    <select
                      value={member.role ?? ''}
                      onChange={(e) => updateMemberRole(team.id, member.id, e.target.value as TeamRole)}
                      className="brutal-border bg-brutal-light-gray px-3 py-2 font-display font-bold text-sm uppercase cursor-pointer outline-none focus:border-brutal-yellow"
                    >
                      <option value="">역할 선택</option>
                      {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Role Legend */}
      <Card>
        <h3 className="font-display font-bold text-lg uppercase mb-4">역할 안내</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(ROLE_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className="brutal-border p-3 bg-brutal-light-gray">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} />
                  <span className="font-display font-bold text-sm uppercase">{config.label}</span>
                </div>
                <p className="text-xs text-brutal-gray">{config.description}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Start Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!allReady}
      >
        대결 시작
      </Button>
    </div>
  )
}
