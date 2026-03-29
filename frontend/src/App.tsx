import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { BattlePage } from './pages/BattlePage'
import { QuestsPage } from './pages/QuestsPage'
import { RankingPage } from './pages/RankingPage'
import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/LoginPage'
import { RoomCreatePage } from './pages/RoomCreatePage'
import { LearnerEntryPage } from './pages/LearnerEntryPage'
import { TeamFormationPage } from './pages/TeamFormationPage'
import { BattlePrepPage } from './pages/BattlePrepPage'
import { ResultsPage } from './pages/ResultsPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { EventsPage } from './pages/EventsPage'
import { FinalReportPage } from './pages/FinalReportPage'
import { InfographicPage } from './pages/InfographicPage'
import { useAuthStore } from './stores/authStore'
import type { ReactNode } from 'react'

function AuthGuard({ children }: { readonly children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Full-screen protected */}
        <Route path="/battle/prep" element={<AuthGuard><BattlePrepPage /></AuthGuard>} />
        <Route path="/battle/results" element={<AuthGuard><ResultsPage /></AuthGuard>} />

        {/* Layout protected */}
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/battle/:questId" element={<BattlePage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/room/create" element={<RoomCreatePage />} />
          <Route path="/room/join" element={<LearnerEntryPage />} />
          <Route path="/join" element={<LearnerEntryPage />} />
          <Route path="/team" element={<TeamFormationPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/report" element={<FinalReportPage />} />
          <Route path="/infographic" element={<InfographicPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
