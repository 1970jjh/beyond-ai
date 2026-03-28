import { QUESTS } from '../data/quests'

// Mock data for dashboard
const MONTHLY_RESULTS = [
  { month: 1, human: 82, ai: 78, winner: 'human' as const },
  { month: 2, human: 75, ai: 85, winner: 'ai' as const },
  { month: 3, human: 88, ai: 86, winner: 'human' as const },
]

const SKILL_SCORES = [
  { skill: '데이터 분석', human: 85, ai: 92 },
  { skill: '창의적 사고', human: 90, ai: 72 },
  { skill: '논리적 사고', human: 78, ai: 95 },
  { skill: '공감 능력', human: 94, ai: 55 },
  { skill: '커뮤니케이션', human: 88, ai: 70 },
  { skill: '문제 해결', human: 82, ai: 88 },
]

const BADGES = [
  { icon: '🥇', title: '첫 승리', desc: '첫 번째 퀘스트 승리', earned: true },
  { icon: '🧠', title: '분석의 달인', desc: '분석 점수 90점 이상', earned: true },
  { icon: '🔥', title: '연승 행진', desc: '3연승 달성', earned: false },
  { icon: '💎', title: '완벽주의자', desc: '전 항목 90점 이상', earned: false },
  { icon: '⚡', title: '스피드러너', desc: '제한시간의 50% 이내 완료', earned: true },
  { icon: '🏆', title: '그랜드마스터', desc: '12개 퀘스트 모두 승리', earned: false },
]

function BarChart({ label, value, max, color }: {
  readonly label: string
  readonly value: number
  readonly max: number
  readonly color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        width: 80,
        textAlign: 'right',
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        height: 16,
        position: 'relative',
      }}>
        <div style={{
          background: color,
          height: '100%',
          width: `${(value / max) * 100}%`,
          transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700,
        color,
        width: 30,
        flexShrink: 0,
      }}>
        {value}
      </span>
    </div>
  )
}

export function Dashboard() {
  const humanWins = MONTHLY_RESULTS.filter((r) => r.winner === 'human').length
  const aiWins = MONTHLY_RESULTS.filter((r) => r.winner === 'ai').length

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: 80,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--accent)',
            letterSpacing: '3px',
            marginBottom: 12,
          }}>
            ANALYTICS DASHBOARD
          </div>
          <h1 style={{
            fontSize: 40,
            fontWeight: 900,
            margin: 0,
            letterSpacing: '-1.5px',
          }}>
            분석 대시보드
          </h1>
        </div>

        {/* Score Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 32,
        }}>
          {/* Human Score */}
          <div style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--human)',
            boxShadow: '6px 6px 0px var(--human)',
            padding: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧑</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 48,
              fontWeight: 900,
              color: 'var(--human)',
            }}>
              {humanWins}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              letterSpacing: '1px',
            }}>
              사람 팀 승리
            </div>
          </div>

          {/* VS */}
          <div style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--accent)',
            boxShadow: '6px 6px 0px var(--accent)',
            padding: 24,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              color: 'var(--text-muted)',
              marginBottom: 8,
              letterSpacing: '2px',
            }}>
              총 전적
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 36,
              fontWeight: 900,
            }}>
              <span style={{ color: 'var(--human)' }}>{humanWins}</span>
              <span style={{ color: 'var(--text-dim)', margin: '0 12px' }}>:</span>
              <span style={{ color: 'var(--ai)' }}>{aiWins}</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-dim)',
              marginTop: 8,
            }}>
              {MONTHLY_RESULTS.length} / 12 퀘스트 완료
            </div>
          </div>

          {/* AI Score */}
          <div style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--ai)',
            boxShadow: '6px 6px 0px var(--ai)',
            padding: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 48,
              fontWeight: 900,
              color: 'var(--ai)',
            }}>
              {aiWins}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              letterSpacing: '1px',
            }}>
              AI 승리
            </div>
          </div>
        </div>

        {/* Monthly Results Timeline */}
        <div style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border)',
          padding: 24,
          marginBottom: 32,
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: 20,
            letterSpacing: '1px',
          }}>
            월별 결과
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 8,
          }}>
            {QUESTS.map((quest) => {
              const result = MONTHLY_RESULTS.find((r) => r.month === quest.month)
              const isCompleted = !!result
              const isActive = quest.month <= 3

              return (
                <div key={quest.id} style={{
                  textAlign: 'center',
                  opacity: isActive ? 1 : 0.3,
                }}>
                  <div style={{
                    background: isCompleted
                      ? result.winner === 'human' ? 'var(--human)' : 'var(--ai)'
                      : 'var(--bg)',
                    border: `2px solid ${isCompleted
                      ? result.winner === 'human' ? 'var(--human)' : 'var(--ai)'
                      : 'var(--border)'}`,
                    height: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }}>
                    {isCompleted ? (
                      <>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#000',
                        }}>
                          {result.human}:{result.ai}
                        </span>
                        <span style={{
                          fontSize: 10,
                          color: '#000',
                          fontWeight: 700,
                        }}>
                          {result.winner === 'human' ? '🧑' : '🤖'}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 14 }}>
                        {isActive ? quest.icon : '🔒'}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--text-dim)',
                  }}>
                    {quest.month}월
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skills Comparison & Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}>
          {/* Skills Chart */}
          <div style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--border)',
            padding: 24,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--accent)',
              marginBottom: 20,
              letterSpacing: '1px',
            }}>
              역량별 비교
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              gap: 20,
              marginBottom: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: 'var(--human)' }} />
                <span style={{ color: 'var(--text-muted)' }}>사람</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: 'var(--ai)' }} />
                <span style={{ color: 'var(--text-muted)' }}>AI</span>
              </div>
            </div>

            {SKILL_SCORES.map((skill) => (
              <div key={skill.skill} style={{ marginBottom: 12 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}>
                  {skill.skill}
                </div>
                <BarChart label="사람" value={skill.human} max={100} color="var(--human)" />
                <BarChart label="AI" value={skill.ai} max={100} color="var(--ai)" />
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--border)',
            padding: 24,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--accent)',
              marginBottom: 20,
              letterSpacing: '1px',
            }}>
              배지 & 칭호
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              {BADGES.map((badge) => (
                <div
                  key={badge.title}
                  style={{
                    background: badge.earned ? 'var(--bg-elevated)' : 'var(--bg)',
                    border: `2px solid ${badge.earned ? 'var(--accent)' : 'var(--border)'}`,
                    padding: 16,
                    textAlign: 'center',
                    opacity: badge.earned ? 1 : 0.4,
                  }}
                >
                  <div style={{
                    fontSize: 32,
                    marginBottom: 8,
                    filter: badge.earned ? 'none' : 'grayscale(1)',
                  }}>
                    {badge.icon}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: badge.earned ? 'var(--text)' : 'var(--text-dim)',
                    marginBottom: 4,
                  }}>
                    {badge.title}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-dim)',
                  }}>
                    {badge.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          borderTop: '3px solid var(--border)',
          padding: '32px 0',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-dim)',
            letterSpacing: '1px',
          }}>
            BEYOND AI — JJ Creative 교육연구소 &copy; 2026
          </div>
        </footer>
      </div>
    </div>
  )
}
