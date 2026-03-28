import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Swords, Map, LayoutDashboard, Trophy, Settings } from 'lucide-react'

const navItems = [
  { path: '/', label: '대시보드', icon: LayoutDashboard },
  { path: '/battle', label: '대결', icon: Swords },
  { path: '/quests', label: '퀘스트', icon: Map },
  { path: '/ranking', label: '랭킹', icon: Trophy },
] as const

export function Header() {
  const location = useLocation()

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
                    'flex items-center gap-2 px-4 py-2 font-display font-bold text-sm uppercase tracking-wider no-underline transition-colors',
                    isActive
                      ? 'bg-brutal-yellow text-brutal-black'
                      : 'text-brutal-white hover:bg-brutal-gray',
                  )}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              )
            })}
          </nav>

          <Link
            to="/admin"
            className="flex items-center gap-2 px-3 py-2 text-brutal-white hover:bg-brutal-gray transition-colors no-underline"
          >
            <Settings size={18} />
            <span className="hidden md:inline font-display font-bold text-sm uppercase">관리자</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
