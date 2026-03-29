import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Loader2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { ScoreAnimation } from '../components/gamification/ScoreAnimation'
import { gamificationApi } from '../services/api'
import type { LeaderboardEntry } from '../services/api'

interface RankingRow {
  readonly rank: number
  readonly name: string
  readonly team: string
  readonly score: number
  readonly wins: number
  readonly icon: string
}

const MOCK_RANKINGS: ReadonlyArray<RankingRow> = [
  { rank: 1, name: '김민수', team: 'Alpha', score: 165, wins: 2, icon: '🥇' },
  { rank: 2, name: '이지은', team: 'Beta', score: 158, wins: 1, icon: '🥈' },
  { rank: 3, name: '박준호', team: 'Alpha', score: 152, wins: 1, icon: '🥉' },
  { rank: 4, name: '최서연', team: 'Gamma', score: 145, wins: 1, icon: '' },
  { rank: 5, name: '정우진', team: 'Beta', score: 140, wins: 0, icon: '' },
  { rank: 6, name: '한소희', team: 'Gamma', score: 135, wins: 0, icon: '' },
]

function mapApiToRanking(entries: ReadonlyArray<LeaderboardEntry>): ReadonlyArray<RankingRow> {
  return entries.map((e) => ({
    rank: e.rank,
    name: e.display_name,
    team: '-',
    score: e.total_points,
    wins: e.courses_completed,
    icon: e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : '',
  }))
}

export function RankingPage() {
  const [rankings, setRankings] = useState<ReadonlyArray<RankingRow>>(MOCK_RANKINGS)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('access_token')))

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    gamificationApi.leaderboard(20)
      .then((data) => {
        if (data.length > 0) {
          setRankings(mapApiToRanking(data))
        }
      })
      .catch(() => { /* fallback to mock */ })
      .finally(() => setLoading(false))
  }, [])

  const top3 = rankings.length >= 3
    ? [rankings[1], rankings[0], rankings[2]]
    : rankings.slice(0, 3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">랭킹</h1>
        <p className="text-brutal-gray text-lg">AI와의 대결에서 가장 뛰어난 성과를 보인 참가자</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin text-brutal-yellow" />
        </div>
      )}

      {/* Top 3 Podium */}
      {!loading && top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end">
          {top3.map((player, index) => {
            const heights = ['h-32', 'h-44', 'h-24']
            const bgColors = ['bg-gray-200', 'bg-brutal-yellow', 'bg-orange-200']
            return (
              <motion.div
                key={player.rank}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className={`text-center ${bgColors[index]}`}>
                  <div className="text-3xl mb-2">{player.icon}</div>
                  <div className="font-display font-bold text-lg">{player.name}</div>
                  <div className="font-mono font-bold text-2xl mt-1">
                    <ScoreAnimation targetScore={player.score} />
                  </div>
                  <div className={`brutal-border ${bgColors[index]} ${heights[index]} mt-4 flex items-end justify-center pb-2`}>
                    <span className="font-display font-bold text-4xl">{player.rank}</span>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full Rankings Table */}
      {!loading && (
        <Card>
          <h3 className="font-display font-bold text-lg uppercase mb-4 flex items-center gap-2">
            <Trophy size={20} />
            전체 랭킹
          </h3>
          <div className="space-y-2">
            {rankings.map((player, index) => (
              <motion.div
                key={player.rank}
                className="flex items-center gap-4 brutal-border p-4 bg-brutal-light-gray hover:bg-brutal-yellow/20 transition-colors"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.08 }}
              >
                <span className="font-display font-bold text-2xl w-10 text-center">
                  {player.icon || player.rank}
                </span>
                <div className="flex-1">
                  <div className="font-bold">{player.name}</div>
                  {player.team !== '-' && <div className="text-sm text-brutal-gray">팀 {player.team}</div>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Medal size={16} className="text-brutal-yellow" />
                  <span className="font-bold">{player.wins}승</span>
                </div>
                <span className="font-mono font-bold text-xl">{player.score}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
