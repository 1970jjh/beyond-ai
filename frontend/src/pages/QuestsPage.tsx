import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Swords, CheckCircle, Lock, Clock, Play } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { QUEST_CONFIGS } from '../data/quests'
import { battleApi } from '../services/api'
import clsx from 'clsx'

export function QuestsPage() {
  const navigate = useNavigate()
  const [completedIds, setCompletedIds] = useState<ReadonlyArray<string>>(() => {
    try {
      const results = JSON.parse(localStorage.getItem('beyond-ai-results') || '[]')
      return results.map((r: { questId: string }) => r.questId)
    } catch { return [] }
  })

  useEffect(() => {
    // Try to enrich with API data
    const token = localStorage.getItem('access_token')
    if (!token) return

    battleApi.myBattles()
      .then((data) => {
        const apiCompletedIds = data.battles
          .filter(b => b.status === 'COMPLETED')
          .map(b => `q${b.quest_id}`)
        if (apiCompletedIds.length > 0) {
          setCompletedIds(prev => {
            const merged = new Set([...prev, ...apiCompletedIds])
            return [...merged]
          })
        }
      })
      .catch(() => { /* fallback to local */ })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">12개월 퀘스트</h1>
        <p className="text-brutal-gray text-lg">매월 새로운 도전이 기다립니다</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUEST_CONFIGS.map((quest, index) => {
          const isCompleted = completedIds.includes(quest.id)
          const currentMonth = new Date().getMonth() + 1
          const isActive = quest.month === currentMonth
          const isUpcoming = quest.month === currentMonth + 1
          const isLocked = quest.month > currentMonth + 1

          const statusConfig = isCompleted
            ? { icon: CheckCircle, label: '완료', color: 'text-human' }
            : isActive
              ? { icon: Play, label: '진행 중', color: 'text-brutal-green' }
              : isUpcoming
                ? { icon: Clock, label: '예정', color: 'text-brutal-orange' }
                : isLocked
                  ? { icon: Lock, label: '잠김', color: 'text-brutal-gray' }
                  : { icon: Swords, label: '도전 가능', color: 'text-brutal-yellow' }

          const StatusIcon = statusConfig.icon

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={clsx(
                  'relative overflow-hidden',
                  isLocked && 'opacity-60',
                )}
                onClick={!isLocked ? () => navigate(`/battle/${quest.id}`) : undefined}
              >
                <div className="absolute top-0 right-0 bg-brutal-black text-brutal-white font-display font-bold text-sm px-3 py-1">
                  {quest.month}월
                </div>

                <div className="flex items-start gap-4 pt-2">
                  <div className={clsx('brutal-border p-3', statusConfig.color)}>
                    <StatusIcon size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('text-xs font-bold uppercase', statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg mb-1">{quest.icon} {quest.title}</h3>
                    <p className="text-sm text-brutal-gray">{quest.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="brutal-border px-2 py-0.5 text-xs font-bold bg-brutal-light-gray">{quest.coreSkill}</span>
                      <span className="brutal-border px-2 py-0.5 text-xs font-bold bg-brutal-light-gray uppercase">{quest.difficulty}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
