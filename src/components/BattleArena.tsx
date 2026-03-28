import { useState, useEffect, useCallback } from 'react'
import type { Quest } from '../types'

interface BattleArenaProps {
  readonly quest: Quest
  readonly onBack: () => void
}

type Phase = 'ready' | 'battle' | 'result'

interface ScoreState {
  readonly human: number
  readonly ai: number
}

interface CriterionScore {
  readonly name: string
  readonly human: number
  readonly ai: number
}

const CRITERIA: readonly string[] = [
  '정확성',
  '창의성',
  '실행 가능성',
  '논리성',
  '완성도',
]

export function BattleArena({ quest, onBack }: BattleArenaProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [timeLeft, setTimeLeft] = useState(30)
  const [scores, setScores] = useState<ScoreState>({ human: 0, ai: 0 })
  const [criteriaScores, setCriteriaScores] = useState<readonly CriterionScore[]>([])
  const [aiProgress, setAiProgress] = useState(0)
  const [humanSubmitted, setHumanSubmitted] = useState(false)

  const generateResults = useCallback(() => {
    const results: CriterionScore[] = CRITERIA.map((name) => ({
      name,
      human: Math.floor(Math.random() * 30) + 70,
      ai: Math.floor(Math.random() * 30) + 70,
    }))
    const humanTotal = Math.round(results.reduce((sum, c) => sum + c.human, 0) / results.length)
    const aiTotal = Math.round(results.reduce((sum, c) => sum + c.ai, 0) / results.length)

    setCriteriaScores(results)
    setScores({ human: humanTotal, ai: aiTotal })
    setPhase('result')
  }, [])

  useEffect(() => {
    if (phase !== 'battle') return

    if (timeLeft <= 0) {
      generateResults()
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1)
      setAiProgress((prev) => Math.min(prev + Math.random() * 5 + 2, 100))
    }, 1000)

    return () => clearTimeout(timer)
  }, [phase, timeLeft, generateResults])

  const handleStartBattle = () => {
    setPhase('battle')
    setTimeLeft(30)
    setAiProgress(0)
    setHumanSubmitted(false)
  }

  const handleHumanSubmit = () => {
    setHumanSubmitted(true)
    if (aiProgress >= 80) {
      generateResults()
    }
  }

  const winner = scores.human > scores.ai ? 'human' : scores.ai > scores.human ? 'ai' : 'draw'

  return (
    <div style={{
      minHeight: '100vh',
      paddingTop: 80,
      background: 'var(--bg)',
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '2px solid var(--border)',
            color: 'var(--text-muted)',
            padding: '8px 16px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          ← 퀘스트 목록
        </button>

        {/* Quest Title */}
        <div style={{
          background: 'var(--bg-card)',
          border: `3px solid ${quest.color}`,
          boxShadow: `6px 6px 0px ${quest.color}`,
          padding: 24,
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 48 }}>{quest.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: quest.color,
                fontWeight: 700,
                marginBottom: 4,
              }}>
                QUEST #{String(quest.month).padStart(2, '0')} — {quest.month}월
              </div>
              <h1 style={{
                fontSize: 28,
                fontWeight: 900,
                margin: 0,
                letterSpacing: '-1px',
              }}>
                {quest.title}
              </h1>
              <p style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginTop: 8,
                lineHeight: 1.6,
              }}>
                {quest.description}
              </p>
            </div>
          </div>
        </div>

        {/* READY PHASE */}
        {phase === 'ready' && (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            animation: 'fadeIn 0.6s ease-out',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              color: 'var(--text-muted)',
              marginBottom: 24,
              letterSpacing: '2px',
            }}>
              대결 준비 완료
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 40,
              marginBottom: 48,
            }}>
              {/* Human side */}
              <div style={{
                background: 'var(--bg-card)',
                border: '3px solid var(--human)',
                boxShadow: '6px 6px 0px var(--human)',
                padding: '32px 40px',
                minWidth: 200,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧑</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'var(--human)',
                }}>
                  사람 팀
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 8,
                }}>
                  HUMAN TEAM
                </div>
              </div>

              {/* VS */}
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 48,
                fontWeight: 900,
                color: 'var(--accent)',
                textShadow: '0 0 20px var(--accent)',
              }}>
                VS
              </div>

              {/* AI side */}
              <div style={{
                background: 'var(--bg-card)',
                border: '3px solid var(--ai)',
                boxShadow: '6px 6px 0px var(--ai)',
                padding: '32px 40px',
                minWidth: 200,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 20,
                  fontWeight: 900,
                  color: 'var(--ai)',
                }}>
                  AI
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 8,
                }}>
                  ARTIFICIAL INTELLIGENCE
                </div>
              </div>
            </div>

            <button
              onClick={handleStartBattle}
              style={{
                background: 'var(--accent)',
                color: '#000',
                border: '3px solid var(--accent)',
                boxShadow: '6px 6px 0px #fff',
                padding: '16px 48px',
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '2px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-3px, -3px)'
                e.currentTarget.style.boxShadow = '9px 9px 0px #fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '6px 6px 0px #fff'
              }}
            >
              대결 시작
            </button>
          </div>
        )}

        {/* BATTLE PHASE */}
        {phase === 'battle' && (
          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {/* Timer */}
            <div style={{
              textAlign: 'center',
              marginBottom: 32,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 64,
                fontWeight: 900,
                color: timeLeft <= 10 ? 'var(--danger)' : 'var(--accent)',
                textShadow: timeLeft <= 10 ? '0 0 30px var(--danger)' : '0 0 30px var(--accent)',
                animation: timeLeft <= 10 ? 'pulse 0.5s infinite' : 'none',
              }}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-muted)',
                letterSpacing: '3px',
              }}>
                남은 시간
              </div>
            </div>

            {/* Two columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
            }}>
              {/* Human side */}
              <div style={{
                background: 'var(--bg-card)',
                border: '3px solid var(--human)',
                padding: 24,
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--human)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  🧑 사람 팀
                  {humanSubmitted && (
                    <span style={{
                      background: 'var(--human)',
                      color: '#000',
                      padding: '2px 8px',
                      fontSize: 10,
                    }}>
                      제출 완료
                    </span>
                  )}
                </div>

                <div style={{
                  background: 'var(--bg)',
                  border: '2px solid var(--border)',
                  padding: 16,
                  minHeight: 200,
                  marginBottom: 16,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  lineHeight: 1.8,
                }}>
                  {humanSubmitted ? (
                    <div style={{ color: 'var(--human)' }}>
                      ✓ 답변이 제출되었습니다.<br />
                      AI의 작업 완료를 대기 중...
                    </div>
                  ) : (
                    <>
                      여기에 팀의 답변을 작성하세요...<br /><br />
                      실제 교육에서는 팀별로 논의 후<br />
                      결과물을 제출합니다.
                    </>
                  )}
                </div>

                {!humanSubmitted && (
                  <button
                    onClick={handleHumanSubmit}
                    style={{
                      width: '100%',
                      background: 'var(--human)',
                      color: '#000',
                      border: '2px solid var(--human)',
                      padding: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    답변 제출
                  </button>
                )}
              </div>

              {/* AI side */}
              <div style={{
                background: 'var(--bg-card)',
                border: '3px solid var(--ai)',
                padding: 24,
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--ai)',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  🤖 AI
                  <span style={{
                    background: aiProgress >= 100 ? 'var(--accent)' : 'var(--ai)',
                    color: '#000',
                    padding: '2px 8px',
                    fontSize: 10,
                  }}>
                    {aiProgress >= 100 ? '완료' : '작업 중...'}
                  </span>
                </div>

                <div style={{
                  background: 'var(--bg)',
                  border: '2px solid var(--border)',
                  padding: 16,
                  minHeight: 200,
                  marginBottom: 16,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ai)',
                  textAlign: 'left',
                  lineHeight: 1.8,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Scanline effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(transparent, var(--ai), transparent)`,
                    opacity: 0.3,
                    animation: 'scanline 2s linear infinite',
                  }} />

                  {'> 데이터 수집 중...'}<br />
                  {'> 패턴 분석 진행...'}<br />
                  {aiProgress > 30 && <>{'> 1차 결과 도출...'}<br /></>}
                  {aiProgress > 50 && <>{'> 교차 검증 실행...'}<br /></>}
                  {aiProgress > 70 && <>{'> 최종 리포트 생성...'}<br /></>}
                  {aiProgress >= 100 && (
                    <span style={{ color: 'var(--accent)' }}>
                      {'> ✓ 작업 완료'}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{
                  background: 'var(--bg)',
                  border: '2px solid var(--border)',
                  height: 24,
                  position: 'relative',
                }}>
                  <div style={{
                    background: `linear-gradient(90deg, var(--ai), var(--accent))`,
                    height: '100%',
                    width: `${Math.min(aiProgress, 100)}%`,
                    transition: 'width 0.5s ease',
                  }} />
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}>
                    {Math.round(Math.min(aiProgress, 100))}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <div style={{ animation: 'slideUp 0.6s ease-out' }}>
            {/* Winner announcement */}
            <div style={{
              textAlign: 'center',
              padding: '40px 0',
              marginBottom: 32,
              background: 'var(--bg-card)',
              border: `3px solid ${winner === 'human' ? 'var(--human)' : winner === 'ai' ? 'var(--ai)' : 'var(--accent)'}`,
              boxShadow: `6px 6px 0px ${winner === 'human' ? 'var(--human)' : winner === 'ai' ? 'var(--ai)' : 'var(--accent)'}`,
            }}>
              <div style={{
                fontSize: 64,
                marginBottom: 12,
              }}>
                {winner === 'human' ? '🎉' : winner === 'ai' ? '🤖' : '🤝'}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: 'var(--text-muted)',
                letterSpacing: '3px',
                marginBottom: 8,
              }}>
                QUEST #{String(quest.month).padStart(2, '0')} 결과
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 36,
                fontWeight: 900,
                color: winner === 'human' ? 'var(--human)' : winner === 'ai' ? 'var(--ai)' : 'var(--accent)',
              }}>
                {winner === 'human' ? '사람 팀 승리!' : winner === 'ai' ? 'AI 승리!' : '무승부!'}
              </div>

              {/* Score display */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 40,
                marginTop: 24,
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 48,
                    fontWeight: 900,
                    color: 'var(--human)',
                  }}>
                    {scores.human}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}>
                    사람 팀
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 24,
                  color: 'var(--text-dim)',
                }}>
                  :
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 48,
                    fontWeight: 900,
                    color: 'var(--ai)',
                  }}>
                    {scores.ai}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}>
                    AI
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria breakdown */}
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
                평가 항목별 비교
              </div>

              {criteriaScores.map((criterion) => (
                <div key={criterion.name} style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--human)' }}>{criterion.human}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{criterion.name}</span>
                    <span style={{ color: 'var(--ai)' }}>{criterion.ai}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 4,
                    height: 12,
                  }}>
                    <div style={{
                      flex: criterion.human,
                      background: 'var(--human)',
                      transition: 'flex 0.5s ease',
                    }} />
                    <div style={{
                      flex: criterion.ai,
                      background: 'var(--ai)',
                      transition: 'flex 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              paddingBottom: 60,
            }}>
              <button
                onClick={onBack}
                style={{
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '3px solid var(--text)',
                  boxShadow: '4px 4px 0px var(--text)',
                  padding: '12px 32px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                퀘스트 목록
              </button>
              <button
                onClick={() => {
                  setPhase('ready')
                  setScores({ human: 0, ai: 0 })
                  setCriteriaScores([])
                }}
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  border: '3px solid var(--accent)',
                  boxShadow: '4px 4px 0px var(--accent)',
                  padding: '12px 32px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                다시 도전
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
