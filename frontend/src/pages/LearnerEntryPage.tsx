import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useRoomStore } from '../stores/roomStore'

export function LearnerEntryPage() {
  const [code, setCode] = useState<ReadonlyArray<string>>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate = useNavigate()

  const joinRoom = useRoomStore((s) => s.joinRoom)
  const isLoading = useRoomStore((s) => s.isLoading)
  const error = useRoomStore((s) => s.error)

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return
    const upper = value.toUpperCase()
    const newCode = code.map((c, i) => (i === index ? upper : c))
    setCode(newCode)

    if (upper && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().slice(0, 6)
    const newCode = code.map((_, i) => pasted[i] || '')
    setCode(newCode)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const isComplete = code.every((c) => c !== '')
  const fullCode = code.join('')

  const handleJoin = async () => {
    if (!isComplete) return
    const success = await joinRoom(fullCode)
    if (success) {
      navigate('/team')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-lg text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo Mark */}
        <motion.div
          className="inline-block brutal-border-thick bg-brutal-yellow text-brutal-black font-display font-bold text-3xl px-4 py-2 shadow-brutal mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
        >
          [B]
        </motion.div>

        <h1 className="text-3xl md:text-4xl mb-2">대결 참여</h1>
        <p className="text-brutal-gray text-lg mb-10">방 코드를 입력하여 대결에 참여하세요</p>

        {/* Code Input Boxes */}
        <div className="flex justify-center gap-3 mb-4">
          {code.map((char, index) => (
            <motion.input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              maxLength={1}
              value={char}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-14 h-16 md:w-16 md:h-20 brutal-border-thick font-mono font-bold text-3xl text-center bg-brutal-light-gray outline-none focus:border-brutal-yellow focus:bg-brutal-yellow/10 uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            className="text-red-500 font-bold text-sm mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        {/* Join Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!isComplete || isLoading}
            onClick={handleJoin}
          >
            {isLoading ? '참여 중...' : '참여하기'}
            {!isLoading && <ArrowRight size={20} />}
          </Button>
        </motion.div>

        {/* OR Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[2px] bg-brutal-gray/30" />
          <span className="font-mono text-xs text-brutal-gray uppercase tracking-wider">또는</span>
          <div className="flex-1 h-[2px] bg-brutal-gray/30" />
        </div>

        {/* QR Button */}
        <Button variant="secondary" className="w-full mb-8">
          <QrCode size={20} />
          QR 코드 스캔
        </Button>

        {/* Admin Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Link
            to="/room/create"
            className="inline-flex items-center gap-2 text-brutal-gray hover:text-brutal-black font-display font-bold text-sm uppercase tracking-wider transition-colors no-underline"
          >
            관리자이신가요? 방 개설하기
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
