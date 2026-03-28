import { useState } from 'react'
import { QUESTS } from '../data/quests'
import { QuestCard } from '../components/QuestCard'
import { BattleArena } from '../components/BattleArena'
import type { Quest } from '../types'

export function QuestList() {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)

  if (selectedQuest) {
    return (
      <BattleArena
        quest={selectedQuest}
        onBack={() => setSelectedQuest(null)}
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: 80,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--accent)',
            letterSpacing: '3px',
            marginBottom: 12,
          }}>
            12 MONTHLY QUESTS
          </div>
          <h1 style={{
            fontSize: 40,
            fontWeight: 900,
            margin: '0 0 8px',
            letterSpacing: '-1.5px',
          }}>
            퀘스트 목록
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            매월 1개의 퀘스트에 도전하세요. 사람 팀과 AI가 동일한 과제를 수행하여 성과를 비교합니다.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border)',
          padding: 20,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-muted)',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}>
            진행률
          </div>
          <div style={{
            flex: 1,
            background: 'var(--bg)',
            border: '2px solid var(--border)',
            height: 20,
            position: 'relative',
          }}>
            <div style={{
              background: 'linear-gradient(90deg, var(--accent), var(--human))',
              height: '100%',
              width: '25%',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
          }}>
            3 / 12
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: 24,
          marginBottom: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 12,
              height: 12,
              background: 'var(--accent)',
              border: '2px solid var(--accent)',
            }} />
            <span style={{ color: 'var(--text-muted)' }}>진행 가능</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 12,
              height: 12,
              background: 'var(--border)',
              border: '2px solid var(--border)',
            }} />
            <span style={{ color: 'var(--text-muted)' }}>잠금</span>
          </div>
        </div>

        {/* Quest Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
          paddingBottom: 60,
        }}>
          {QUESTS.map((quest, index) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              index={index}
              onClick={() => setSelectedQuest(quest)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
