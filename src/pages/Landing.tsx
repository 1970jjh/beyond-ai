import { useNavigate } from 'react-router-dom'

const STATS = [
  { value: '12', label: '퀘스트', suffix: '개' },
  { value: '12', label: '개월', suffix: '개월' },
  { value: '5', label: '평가 기준', suffix: '개' },
  { value: '∞', label: '성장 가능성', suffix: '' },
] as const

const FEATURES = [
  {
    icon: '⚔️',
    title: '실시간 대결',
    desc: '사람과 AI가 동일한 과제를 동시에 수행하고, 실시간으로 진행 상황을 비교합니다.',
    color: '#FF6B35',
  },
  {
    icon: '📊',
    title: '역량 분석',
    desc: '5가지 평가 기준으로 매월 성과를 분석하고, 12개월간의 성장 그래프를 확인합니다.',
    color: '#00aaff',
  },
  {
    icon: '🏆',
    title: '게이미피케이션',
    desc: '월별 승패 기록, 랭킹 시스템, 배지와 칭호로 학습 동기를 극대화합니다.',
    color: '#00ff88',
  },
  {
    icon: '🤖',
    title: 'AI 대전 상대',
    desc: '난이도 조절이 가능한 AI와 대결하며, AI의 사고 프로세스를 실시간으로 관찰합니다.',
    color: '#ff5500',
  },
] as const

export function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Hero Section */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Glowing orb */}
        <div style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.08), transparent 70%)',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--accent)',
            letterSpacing: '4px',
            marginBottom: 24,
            border: '1px solid var(--accent)',
            display: 'inline-block',
            padding: '6px 16px',
            animation: 'fadeIn 0.6s ease-out',
          }}>
            GAMIFICATION CORPORATE TRAINING 2026
          </div>

          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: 900,
            lineHeight: 1.1,
            margin: '0 0 16px',
            animation: 'fadeIn 0.6s ease-out 0.1s both',
          }}>
            <span style={{ color: 'var(--text)' }}>BEYOND</span>
            <br />
            <span style={{
              color: 'var(--accent)',
              textShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
            }}>
              AI
            </span>
          </h1>

          <p style={{
            fontSize: 18,
            color: 'var(--text-muted)',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.8,
            animation: 'fadeIn 0.6s ease-out 0.2s both',
          }}>
            사람과 AI가 12개월에 걸쳐 승부하는<br />
            게이미피케이션 기업교육 프로그램
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
            animation: 'fadeIn 0.6s ease-out 0.3s both',
          }}>
            <button
              onClick={() => navigate('/quests')}
              style={{
                background: 'var(--accent)',
                color: '#000',
                border: '3px solid var(--accent)',
                boxShadow: '6px 6px 0px #fff',
                padding: '16px 40px',
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '1px',
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
              퀘스트 시작
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                color: 'var(--text)',
                border: '3px solid var(--text)',
                boxShadow: '6px 6px 0px var(--text)',
                padding: '16px 40px',
                fontFamily: 'var(--font-mono)',
                fontSize: 16,
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '1px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-3px, -3px)'
                e.currentTarget.style.boxShadow = '9px 9px 0px var(--text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)'
                e.currentTarget.style.boxShadow = '6px 6px 0px var(--text)'
              }}
            >
              대시보드
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-dim)',
          letterSpacing: '2px',
          animation: 'pulse 2s infinite',
        }}>
          ↓ SCROLL
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        borderTop: '3px solid var(--border)',
        borderBottom: '3px solid var(--border)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 48,
              fontWeight: 900,
              color: 'var(--accent)',
              marginBottom: 8,
            }}>
              {stat.value}<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{stat.suffix}</span>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--text-muted)',
              letterSpacing: '1px',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 24px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--accent)',
          letterSpacing: '3px',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          CORE FEATURES
        </div>
        <h2 style={{
          fontSize: 36,
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: 48,
          letterSpacing: '-1px',
        }}>
          핵심 기능
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              style={{
                background: 'var(--bg-card)',
                border: `3px solid ${feature.color}`,
                boxShadow: `6px 6px 0px ${feature.color}`,
                padding: 24,
                animation: `fadeIn 0.4s ease-out ${i * 0.1}s both`,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{feature.icon}</div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 8,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.5px',
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        borderTop: '3px solid var(--border)',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 24px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--accent)',
          letterSpacing: '3px',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          HOW IT WORKS
        </div>
        <h2 style={{
          fontSize: 36,
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: 48,
          letterSpacing: '-1px',
        }}>
          진행 방식
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          maxWidth: 900,
          margin: '0 auto',
        }}>
          {[
            { step: '01', title: '퀘스트 선택', desc: '매월 1개의 퀘스트가 공개됩니다. 팀을 구성하고 도전하세요.' },
            { step: '02', title: '동시 수행', desc: '사람 팀과 AI가 동일한 과제를 동시에 수행합니다. 실시간 진행 비교!' },
            { step: '03', title: '결과 비교', desc: '5가지 기준으로 평가하고, 월별 승자를 결정합니다.' },
          ].map((item, i) => (
            <div key={item.step} style={{
              textAlign: 'center',
              animation: `fadeIn 0.4s ease-out ${i * 0.15}s both`,
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 48,
                fontWeight: 900,
                color: 'var(--accent)',
                marginBottom: 16,
                textShadow: '0 0 20px rgba(0, 255, 136, 0.2)',
              }}>
                {item.step}
              </div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 8,
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                lineHeight: 1.7,
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '3px solid var(--border)',
        padding: '32px 24px',
        textAlign: 'center',
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
  )
}
