import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', label: '홈' },
  { path: '/quests', label: '퀘스트' },
  { path: '/dashboard', label: '대시보드' },
] as const

export function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(10, 10, 10, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '2px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <div
          onClick={() => navigate('/')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 24,
            fontWeight: 900,
            color: 'var(--accent)',
            letterSpacing: '-1px',
          }}>
            BEYOND
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 24,
            fontWeight: 900,
            color: 'var(--text)',
            letterSpacing: '-1px',
          }}>
            AI
          </span>
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '2px 6px',
            marginLeft: 4,
          }}>
            v1.0
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'var(--bg)' : 'var(--text-muted)',
                  border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '8px 20px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.borderColor = 'transparent'
                  }
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
