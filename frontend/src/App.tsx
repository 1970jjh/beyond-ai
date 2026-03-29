import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { BattlePage } from './pages/BattlePage'
import { QuestsPage } from './pages/QuestsPage'
import { RankingPage } from './pages/RankingPage'
import { AdminPage } from './pages/AdminPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
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
import { EventPopup } from './components/shared/EventPopup'
import { ToastContainer } from './components/shared/ToastContainer'

export function App() {
  return (
    <BrowserRouter>
      {/* Global overlays */}
      <EventPopup />
      <ToastContainer />

      <Routes>
        {/* Full-screen pages (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/battle/prep" element={<BattlePrepPage />} />
        <Route path="/battle/results" element={<ResultsPage />} />

        {/* Pages with layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/room/create" element={<RoomCreatePage />} />
          <Route path="/room/join" element={<LearnerEntryPage />} />
          <Route path="/join" element={<LearnerEntryPage />} />
          <Route path="/team" element={<TeamFormationPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/report" element={<FinalReportPage />} />
          <Route path="/infographic" element={<InfographicPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
