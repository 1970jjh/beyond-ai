import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'learner' | 'admin' | null>(null)
  const loginLocal = useAuthStore(s => s.loginLocal)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role) return
    loginLocal(name.trim(), role)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-brutal-black flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none scanline z-10" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0, 0, 1] }}
      >
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-block border-4 border-brutal-yellow bg-brutal-yellow text-brutal-black font-display font-bold text-4xl px-6 py-3 mb-6 shadow-brutal-xl">
            [B]
          </div>
          <h1
            className="font-display font-bold text-5xl md:text-6xl text-brutal-white uppercase tracking-tight glitch mb-4"
            data-text="BEYOND AI"
          >
            BEYOND AI
          </h1>
          <p className="font-mono text-brutal-yellow text-sm tracking-wider uppercase">
            사람 vs AI, 12개월의 성장 대결
          </p>
        </motion.div>

        <motion.form
          className="border-4 border-brutal-white bg-brutal-card p-8 shadow-brutal-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
        >
          <p className="text-brutal-white text-center font-body mb-8 text-lg leading-relaxed">
            AI를 넘어서는
            <br />
            <span className="font-display font-bold text-brutal-yellow">진짜 실력</span>을 키우다
          </p>

          <div className="mb-6">
            <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-2">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full border-3 border-brutal-white bg-brutal-dark text-brutal-white px-4 py-3 font-body text-lg outline-none focus:border-brutal-yellow placeholder:text-brutal-gray"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-3">
              역할 선택
            </label>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                onClick={() => setRole('learner')}
                className={`border-3 p-4 text-center transition-all cursor-pointer ${
                  role === 'learner'
                    ? 'border-human bg-human/20 text-brutal-white shadow-brutal-human'
                    : 'border-brutal-gray text-brutal-gray hover:border-brutal-white hover:text-brutal-white'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <GraduationCap className="mx-auto mb-2" size={28} />
                <span className="font-display font-bold text-sm uppercase block">학습자</span>
                <p className="text-xs mt-1 opacity-80">퀘스트 참여 & AI 대결</p>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setRole('admin')}
                className={`border-3 p-4 text-center transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'border-brutal-purple bg-brutal-purple/20 text-brutal-white shadow-brutal'
                    : 'border-brutal-gray text-brutal-gray hover:border-brutal-white hover:text-brutal-white'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Crown className="mx-auto mb-2" size={28} />
                <span className="font-display font-bold text-sm uppercase block">관리자</span>
                <p className="text-xs mt-1 opacity-80">프로그램 관리 & 분석</p>
              </motion.button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim() || !role}
            className="w-full bg-brutal-yellow text-brutal-black font-display font-bold text-lg uppercase tracking-wider py-4 px-6 border-4 border-brutal-black shadow-brutal-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            whileHover={name.trim() && role ? { y: -2, boxShadow: '6px 6px 0px #000000' } : undefined}
            whileTap={name.trim() && role ? { y: 2, x: 2, boxShadow: '0px 0px 0px #000000' } : undefined}
          >
            시작하기
          </motion.button>
        </motion.form>

        <motion.p
          className="text-center mt-8 font-mono text-xs text-brutal-gray tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          &copy; 2026 Beyond AI. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  )
}
