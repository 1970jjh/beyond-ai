import { Outlet } from 'react-router-dom'
import { Header } from './Header'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brutal-light-gray">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="brutal-border-thick border-b-0 border-x-0 bg-brutal-black text-brutal-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="font-display font-bold text-sm uppercase tracking-wider">
            Beyond AI &mdash; 사람 vs AI 12개월 퀘스트 프로그램
          </p>
        </div>
      </footer>
    </div>
  )
}
