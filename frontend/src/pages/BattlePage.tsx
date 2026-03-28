import { BattleArena } from '../components/battle/BattleArena'
import { AiProcessView } from '../components/battle/AiProcessView'
import { MOCK_BATTLE, MOCK_AI_STEPS, QUESTS } from '../utils/mockData'

export function BattlePage() {
  const activeQuest = QUESTS.find((q) => q.status === 'active')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl mb-1">대결 진행</h1>
        {activeQuest && (
          <p className="text-brutal-gray text-lg">
            {activeQuest.month}월 퀘스트 &mdash; {activeQuest.title}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <BattleArena battle={MOCK_BATTLE} />
        <AiProcessView steps={MOCK_AI_STEPS} />
      </div>
    </div>
  )
}
