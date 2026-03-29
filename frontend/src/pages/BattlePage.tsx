import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, User, Bot, Clock, Send, Lightbulb, AlertCircle } from 'lucide-react'
import { AiProcessView } from '../components/battle/AiProcessView'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { QUEST_CONFIGS } from '../data/quests'
import { battleApi } from '../services/api'
import type { BattleResponseData } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import type { AiProcessStep, BattleScores } from '../types'

type BattlePhase = 'select' | 'task' | 'writing' | 'ai_working' | 'results'

function mapApiBattleToScores(battle: BattleResponseData): BattleScores | null {
  if (!battle.human_scores || !battle.ai_scores) return null
  return {
    quality: { human: battle.human_scores.quality, ai: battle.ai_scores.quality },
    creativity: { human: battle.human_scores.creativity, ai: battle.ai_scores.creativity },
    execution: { human: battle.human_scores.execution, ai: battle.ai_scores.execution },
    efficiency: { human: battle.human_scores.efficiency, ai: battle.ai_scores.efficiency },
  }
}

function mapApiResult(result: string): 'human' | 'ai' | 'draw' | null {
  if (result === 'HUMAN_WIN') return 'human'
  if (result === 'AI_WIN') return 'ai'
  if (result === 'DRAW') return 'draw'
  return null
}

export function BattlePage() {
  const { questId: paramQuestId } = useParams()
  const navigate = useNavigate()
  const updateScore = useAuthStore(s => s.updateScore)
  const addBadge = useAuthStore(s => s.addBadge)
  const userName = useAuthStore(s => s.user?.name) || '학습자'

  const [phase, setPhase] = useState<BattlePhase>(paramQuestId ? 'task' : 'select')
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(paramQuestId || null)
  const [submission, setSubmission] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [aiSteps, setAiSteps] = useState<ReadonlyArray<AiProcessStep>>([])
  const [aiText, setAiText] = useState('')
  const [aiDisplayText, setAiDisplayText] = useState('')
  const [scores, setScores] = useState<BattleScores | null>(null)
  const [winner, setWinner] = useState<'human' | 'ai' | 'draw' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [battleId, setBattleId] = useState<string | null>(null)
  const [battleError, setBattleError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sseCleanupRef = useRef<(() => void) | null>(null)

  const quest = selectedQuestId ? QUEST_CONFIGS.find(q => q.id === selectedQuestId) : null

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { sseCleanupRef.current?.() }
  }, [])

  // Timer
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerActive, timeRemaining])

  const startBattle = useCallback(async () => {
    if (!quest) return
    setBattleError(null)

    const questNum = parseInt(quest.id.replace('q', ''), 10)
    try {
      const battle = await battleApi.start({
        quest_id: questNum,
        task_description: quest.taskPrompt,
        difficulty: quest.difficulty,
        time_limit_sec: quest.timeLimit,
      })
      setBattleId(battle.id)
      setPhase('writing')
      setTimeRemaining(quest.timeLimit)
      setTimerActive(true)

      // Start SSE stream for AI process visualization
      const initialSteps: AiProcessStep[] = quest.aiSteps.map((s, i) => ({
        id: `s${i}`,
        label: s.label,
        description: s.description,
        status: 'pending' as const,
        output: null,
        timestamp: new Date().toISOString(),
      }))
      setAiSteps(initialSteps)

      const cleanup = battleApi.streamAiProcess(battle.id, (event) => {
        const data = event.data as Record<string, unknown>
        if (event.type === 'step_start' || event.type === 'step_progress') {
          const phase = data.phase as string
          setAiSteps(prev => prev.map(step => ({
            ...step,
            status: step.label.toLowerCase().includes(phase) ? 'active' as const : step.status,
          })))
        } else if (event.type === 'step_complete') {
          const phase = data.phase as string
          setAiSteps(prev => prev.map(step => ({
            ...step,
            status: step.label.toLowerCase().includes(phase) ? 'done' as const : step.status,
            output: step.label.toLowerCase().includes(phase) ? `완료: ${step.label}` : step.output,
          })))
        } else if (event.type === 'content') {
          setAiText(prev => prev + String(data))
        } else if (event.type === 'done') {
          setAiSteps(prev => prev.map(step => ({
            ...step,
            status: 'done' as const,
            output: step.output || `완료: ${step.label}`,
          })))
          cleanup()
        }
      })
      sseCleanupRef.current = cleanup
    } catch (error) {
      const message = error instanceof Error ? error.message : '배틀 시작 실패'
      setBattleError(message)
    }
  }, [quest])

  const handleSubmit = useCallback(async () => {
    if (!quest || !submission.trim() || !battleId) return
    setTimerActive(false)
    sseCleanupRef.current?.()
    setPhase('ai_working')

    try {
      const result = await battleApi.submit(battleId, submission)
      const fullAiText = result.ai_submission || ''
      setAiText(fullAiText)
      setAiDisplayText(fullAiText)

      const battleScores = mapApiBattleToScores(result)
      if (battleScores) setScores(battleScores)

      const w = mapApiResult(result.result)
      setWinner(w)
      setPhase('results')

      const xp = w === 'human' ? 250 : w === 'draw' ? 150 : 100
      updateScore(xp)

      if (w === 'human') {
        addBadge({ id: `badge-${quest.id}`, name: `${quest.title} 정복자`, icon: '🎯', tier: 'gold' })
      }

      const humanTotal = result.human_scores?.total ?? 0
      const aiTotal = result.ai_scores?.total ?? 0
      try {
        const saved = JSON.parse(localStorage.getItem('beyond-ai-results') || '[]')
        saved.push({
          questId: quest.id, month: quest.month, title: quest.title,
          humanScore: humanTotal, aiScore: aiTotal,
          winner: w, completedAt: new Date().toISOString(),
        })
        localStorage.setItem('beyond-ai-results', JSON.stringify(saved))
      } catch { /* ignore */ }
    } catch (error) {
      const message = error instanceof Error ? error.message : '제출 실패'
      setBattleError(message)
      setPhase('writing')
      setTimerActive(true)
    }
  }, [quest, submission, battleId, updateScore, addBadge])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // Quest selection phase
  if (phase === 'select') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl mb-1">퀘스트 선택</h1>
          <p className="text-brutal-gray text-lg">도전할 퀘스트를 선택하세요</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUEST_CONFIGS.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="hover:shadow-brutal-lg transition-all"
                onClick={() => { setSelectedQuestId(q.id); setPhase('task') }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{q.icon}</span>
                  <div>
                    <div className="font-mono text-xs text-brutal-gray">{q.month}월</div>
                    <div className="font-display font-bold">{q.title}</div>
                  </div>
                </div>
                <p className="text-sm text-brutal-gray">{q.description}</p>
                <div className="mt-3 flex gap-2">
                  <span className="brutal-border px-2 py-0.5 text-xs font-bold bg-brutal-light-gray">{q.coreSkill}</span>
                  <span className="brutal-border px-2 py-0.5 text-xs font-bold bg-brutal-light-gray uppercase">{q.difficulty}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  // Task briefing phase
  if (phase === 'task' && quest) {
    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="inline-block bg-brutal-yellow text-brutal-black font-mono font-bold text-xs uppercase tracking-wider px-3 py-1 brutal-border mb-4">
            QUEST #{String(quest.month).padStart(2, '0')}
          </span>
          <h1 className="text-3xl md:text-4xl mb-2">{quest.icon} {quest.title}</h1>
          <p className="text-brutal-gray text-lg">{quest.description}</p>
        </motion.div>

        <Card variant="highlight">
          <h3 className="font-display font-bold text-lg uppercase mb-4">과제 내용</h3>
          <div className="whitespace-pre-wrap font-body text-base leading-relaxed">{quest.taskPrompt}</div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-display font-bold uppercase mb-3">평가 기준</h3>
            <div className="space-y-2">
              {quest.evaluationCriteria.map(c => (
                <div key={c} className="brutal-border px-3 py-2 bg-brutal-light-gray font-bold text-sm">{c}</div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="font-display font-bold uppercase mb-3">대결 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-brutal-gray">AI 상대</span>
                <span className="font-bold">{quest.aiPersona}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brutal-gray">제한 시간</span>
                <span className="font-mono font-bold">{formatTime(quest.timeLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brutal-gray">난이도</span>
                <span className="font-bold uppercase">{quest.difficulty}</span>
              </div>
            </div>
          </Card>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={startBattle}>
          <Swords size={20} />
          대결 시작
        </Button>
      </div>
    )
  }

  // Writing / AI Working / Results phases
  if (!quest) return null

  const totalHuman = scores ? scores.quality.human + scores.creativity.human + scores.execution.human + scores.efficiency.human : 0
  const totalAi = scores ? scores.quality.ai + scores.creativity.ai + scores.execution.ai + scores.efficiency.ai : 0

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-brutal-gray uppercase">Quest #{String(quest.month).padStart(2, '0')}</span>
          <h1 className="text-2xl">{quest.title}</h1>
        </div>
        {phase === 'writing' && (
          <motion.div
            className="brutal-border bg-brutal-yellow px-4 py-2 text-center"
            animate={timeRemaining < 60 ? { scale: [1, 1.05, 1] } : undefined}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Clock size={16} className="inline mr-2" />
            <span className="font-mono font-bold text-xl tabular-nums">{formatTime(timeRemaining)}</span>
          </motion.div>
        )}
      </div>

      {/* VS Header */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="brutal-border bg-human p-2 text-brutal-white"><User size={20} /></div>
          <span className="font-display font-bold uppercase">{userName}</span>
        </div>
        <div className="brutal-border bg-brutal-yellow p-2"><Swords size={20} /></div>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold uppercase">AI</span>
          <div className="brutal-border bg-ai p-2 text-brutal-white"><Bot size={20} /></div>
        </div>
      </div>

      {battleError && (
        <div className="brutal-border border-red-500 bg-red-500/20 p-3 flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle size={16} />
          {battleError}
          <button type="button" onClick={() => setBattleError(null)} className="ml-auto font-bold cursor-pointer">✕</button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Human work area */}
        <div className="space-y-4">
          {phase === 'writing' && (
            <>
              <Card variant="highlight" className="py-3 px-4">
                <div className="font-display font-bold text-sm uppercase mb-1">과제</div>
                <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{quest.taskPrompt}</div>
              </Card>

              <div className="relative">
                <textarea
                  value={submission}
                  onChange={e => setSubmission(e.target.value)}
                  placeholder="여기에 답변을 작성하세요..."
                  className="w-full brutal-border p-4 font-body text-base bg-brutal-white min-h-[400px] outline-none focus:border-brutal-yellow resize-none"
                />
                <div className="absolute bottom-3 right-3 font-mono text-xs text-brutal-gray">
                  {submission.length}자
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={!submission.trim()}
                >
                  <Send size={18} />
                  제출하기
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowHint(!showHint)}
                >
                  <Lightbulb size={18} />
                </Button>
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="brutal-border bg-brutal-yellow/20 p-4"
                  >
                    <div className="font-display font-bold text-sm mb-1">힌트</div>
                    <p className="text-sm">{quest.sampleHumanHint}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {phase === 'ai_working' && (
            <Card>
              <h3 className="font-display font-bold uppercase mb-4">AI 답변 생성 중...</h3>
              <div className="brutal-border bg-brutal-light-gray p-4 font-mono text-sm whitespace-pre-wrap min-h-[300px] max-h-[500px] overflow-y-auto">
                {aiDisplayText}
                <span className="inline-block w-2 h-4 bg-brutal-black ml-1" style={{ animation: 'typing-cursor 1s infinite' }} />
              </div>
            </Card>
          )}

          {phase === 'results' && scores && (
            <div className="space-y-6">
              {/* Winner */}
              <motion.div
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="text-5xl mb-3">{winner === 'human' ? '🎉' : winner === 'ai' ? '🤖' : '🤝'}</div>
                <h2 className={`font-display font-bold text-3xl uppercase ${
                  winner === 'human' ? 'text-human' : winner === 'ai' ? 'text-ai' : 'text-brutal-yellow'
                }`}>
                  {winner === 'human' ? '사람이 이겼습니다!' : winner === 'ai' ? 'AI가 이겼습니다!' : '무승부!'}
                </h2>
              </motion.div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <Card variant="human" className="text-center">
                  <div className="font-mono text-xs uppercase text-human mb-1">Human</div>
                  <div className="font-mono font-bold text-4xl text-human">{totalHuman}</div>
                </Card>
                <Card variant="ai" className="text-center">
                  <div className="font-mono text-xs uppercase text-ai mb-1">AI</div>
                  <div className="font-mono font-bold text-4xl text-ai">{totalAi}</div>
                </Card>
              </div>

              {/* Breakdown */}
              <Card>
                <h3 className="font-display font-bold uppercase mb-4">평가 항목</h3>
                {(['quality', 'creativity', 'execution', 'efficiency'] as const).map(key => {
                  const labels: Record<string, string> = { quality: '품질', creativity: '창의성', execution: '실행력', efficiency: '효율' }
                  return (
                    <div key={key} className="mb-3">
                      <div className="font-display font-bold text-sm mb-1">{labels[key]}</div>
                      <ProgressBar value={scores[key].human} variant="human" label="사람" showValue />
                      <ProgressBar value={scores[key].ai} variant="ai" label="AI" showValue />
                    </div>
                  )
                })}
              </Card>

              {/* Submissions comparison */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="font-display font-bold text-sm uppercase mb-2 text-human">나의 답변</h3>
                  <div className="text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{submission}</div>
                </Card>
                <Card>
                  <h3 className="font-display font-bold text-sm uppercase mb-2 text-ai">AI 답변</h3>
                  <div className="text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{aiText || aiDisplayText}</div>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => { setPhase('select'); setSelectedQuestId(null); setSubmission(''); setScores(null); setWinner(null); setAiText(''); setAiDisplayText('') }}>
                  다른 퀘스트
                </Button>
                <Button variant="primary" onClick={() => navigate('/analysis')}>
                  분석 보기
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Process */}
        <div>
          <AiProcessView steps={aiSteps.length > 0 ? aiSteps : quest.aiSteps.map((s, i) => ({
            id: `s${i}`, label: s.label, description: s.description,
            status: 'pending' as const, output: null, timestamp: new Date().toISOString(),
          }))} />
        </div>
      </div>
    </div>
  )
}
