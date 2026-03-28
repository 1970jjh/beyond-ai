import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Landing } from './pages/Landing'
import { QuestList } from './pages/QuestList'
import { Dashboard } from './pages/Dashboard'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quests" element={<QuestList />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  )
}

export default App
