import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { BattlePage } from './pages/BattlePage'
import { QuestsPage } from './pages/QuestsPage'
import { RankingPage } from './pages/RankingPage'
import { AdminPage } from './pages/AdminPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
