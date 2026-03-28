import { motion } from 'framer-motion'
import { QuestCard } from '../components/quest/QuestCard'
import { QUESTS } from '../utils/mockData'

export function QuestsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">12개월 퀘스트</h1>
        <p className="text-brutal-gray text-lg">매월 새로운 도전이 기다립니다</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUESTS.map((quest, index) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <QuestCard quest={quest} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
