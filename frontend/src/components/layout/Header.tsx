import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Swords, Map, LayoutDashboard, Trophy, Settings, BarChart2, LogOut, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const isAdmin = user?.role === 'admin'

  const navItems = [
    { path: '/', label: '대시보드', icon: LayoutDashboard },
    { path: '/battle', label: '대결', icon: Swords },
    { path: '/quests', label: '퀘스트', icon: Map },
    { path: '/ranking', label: '랭킹', icon: Trophy },
    { path: '/analysis', label: '분석', icon: BarChart2 },
  ] as const

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="brutal-border-thick border-t-0 border-x-0 bg-brutal-black text-brutal-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 no-underline text-brutal-white">
            <div className="bg-brutal-yellow text-brutal-black font-display font-bold text-xl px-3 py-1 brutal-border border-brutal-white">
              BEYOND AI
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path ||
                (path !== '/' && location.pathname.startsWith(path))

              return (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 font-display font-bold text-xs uppercase tracking-wider no-underline transition-colors',
                    isActive
                      ? 'bg-brutal-yellow text-brutal-black'
                      : 'text-brutal-white hover:bg-brutal-gray',
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/room/create"
                className="flex items-center gap-1 px-3 py-2 text-brutal-yellow hover:bg-brutal-gray transition-colors no-underline font-display font-bold text-xs uppercase"
              >
                <Plus size={16} />
                <span className="hidden md:inline">방 개설</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1 px-3 py-2 text-brutal-white hover:bg-brutal-gray transition-colors no-underline font-display font-bold text-xs uppercase"
              >
                <Settings size={16} />
                <span className="hidden md:inline">콘솔</span>
              </Link>
            )}
            {user && (
              <span className="hidden md:inline font-mono text-xs text-brutal-gray px-2">
                {user.name} ({user.role === 'admin' ? '관리자' : '학습자'})
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 text-brutal-gray hover:text-brutal-red hover:bg-brutal-gray/30 transition-colors cursor-pointer border-none bg-transparent"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
