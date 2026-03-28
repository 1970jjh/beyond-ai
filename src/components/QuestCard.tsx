import type { Quest } from '../types'

interface QuestCardProps {
  readonly quest: Quest
  readonly onClick: () => void
  readonly index: number
}

export function QuestCard({ quest, onClick, index }: QuestCardProps) {
  const isLocked = quest.month > 3 // MVP: 1~3월만 활성화

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      style={{
        background: isLocked ? 'var(--bg-card)' : 'var(--bg-elevated)',
        border: `3px solid ${isLocked ? 'var(--border)' : quest.color}`,
        padding: 0,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.4 : 1,
        transition: 'all 0.2s ease',
        boxShadow: isLocked ? 'none' : `6px 6px 0px ${quest.color}`,
        animation: `fadeIn 0.4s ease-out ${index * 0.08}s both`,
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isLocked) {
          e.currentTarget.style.transform = 'translate(-3px, -3px)'
          e.currentTarget.style.boxShadow = `9px 9px 0px ${quest.color}`
        }
      }}
      onMouseLeave={(e) => {
        if (!isLocked) {
          e.currentTarget.style.transform = 'translate(0, 0)'
          e.currentTarget.style.boxShadow = `6px 6px 0px ${quest.color}`
        }
      }}
    >
      {/* Top bar with month */}
      <div style={{
        background: isLocked ? 'var(--border)' : quest.color,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          color: isLocked ? 'var(--text-dim)' : '#000',
          letterSpacing: '1px',
        }}>
          QUEST #{String(quest.month).padStart(2, '0')}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: isLocked ? 'var(--text-dim)' : '#000',
          fontWeight: 700,
        }}>
          {quest.month}월
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px' }}>
        <div style={{
          fontSize: 36,
          marginBottom: 12,
          filter: isLocked ? 'grayscale(1)' : 'none',
        }}>
          {isLocked ? '🔒' : quest.icon}
        </div>

        <h3 style={{
          fontSize: 18,
          fontWeight: 900,
          marginBottom: 8,
          color: isLocked ? 'var(--text-dim)' : 'var(--text)',
          letterSpacing: '-0.5px',
        }}>
          {quest.title}
        </h3>

        <div style={{
          display: 'inline-block',
          background: isLocked ? 'transparent' : 'var(--accent-dim)',
          border: `1px solid ${isLocked ? 'var(--border)' : 'var(--accent)'}`,
          padding: '4px 10px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: isLocked ? 'var(--text-dim)' : 'var(--accent)',
          fontWeight: 700,
          letterSpacing: '0.5px',
        }}>
          {quest.skill}
        </div>

        {!isLocked && (
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 12,
            lineHeight: 1.6,
            textAlign: 'left',
          }}>
            {quest.description.slice(0, 80)}...
          </p>
        )}
      </div>

      {/* Bottom action */}
      {!isLocked && (
        <div style={{
          borderTop: `1px solid ${quest.color}33`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: quest.color,
            fontWeight: 700,
          }}>
            대결 시작 →
          </span>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: quest.color,
            animation: 'pulse 2s infinite',
          }} />
        </div>
      )}
    </div>
  )
}
