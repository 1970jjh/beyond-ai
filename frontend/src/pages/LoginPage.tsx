import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Crown, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

type LoginMode = 'demo' | 'login' | 'register'

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('demo')

  // Demo mode state
  const [name, setName] = useState('')
  const [role, setRole] = useState<'learner' | 'admin' | null>(null)

  // API login/register state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [tenantSlug] = useState('default')

  const loginLocal = useAuthStore(s => s.loginLocal)
  const loginWithApi = useAuthStore(s => s.loginWithApi)
  const registerWithApi = useAuthStore(s => s.registerWithApi)
  const isLoading = useAuthStore(s => s.isLoading)
  const authError = useAuthStore(s => s.authError)
  const clearError = useAuthStore(s => s.clearError)
  const navigate = useNavigate()

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role) return
    loginLocal(name.trim(), role)
    navigate(role === 'admin' ? '/admin/dashboard' : '/')
  }

  const handleApiLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    const success = await loginWithApi(tenantSlug, email, password)
    if (success) navigate('/')
  }

  const handleApiRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim() || !displayName.trim()) return
    const success = await registerWithApi(tenantSlug, email, displayName, password)
    if (success) navigate('/')
  }

  const switchMode = (newMode: LoginMode) => {
    clearError()
    setMode(newMode)
  }

  const inputClass = 'w-full border-3 border-brutal-white bg-brutal-dark text-brutal-white px-4 py-3 font-body text-lg outline-none focus:border-brutal-yellow placeholder:text-brutal-gray'

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

        {/* Mode Tabs */}
        <div className="flex mb-0">
          {([
            { key: 'demo' as const, label: '체험 모드' },
            { key: 'login' as const, label: '로그인' },
            { key: 'register' as const, label: '회원가입' },
          ]).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchMode(tab.key)}
              className={`flex-1 py-3 font-display font-bold text-sm uppercase tracking-wider border-3 border-b-0 cursor-pointer transition-colors ${
                mode === tab.key
                  ? 'bg-brutal-card border-brutal-white text-brutal-yellow'
                  : 'bg-brutal-dark border-brutal-gray text-brutal-gray hover:text-brutal-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Demo Mode */}
          {mode === 'demo' && (
            <motion.form
              key="demo"
              className="border-4 border-brutal-white bg-brutal-card p-8 shadow-brutal-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleDemoSubmit}
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
                  className={inputClass}
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
                체험 시작하기
              </motion.button>

              <p className="text-center mt-4 font-mono text-xs text-brutal-gray">
                체험 모드: 로컬에서만 작동하며 서버에 저장되지 않습니다
              </p>
            </motion.form>
          )}

          {/* API Login */}
          {mode === 'login' && (
            <motion.form
              key="login"
              className="border-4 border-brutal-white bg-brutal-card p-8 shadow-brutal-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleApiLogin}
            >
              <p className="text-brutal-white text-center font-body mb-8 text-lg leading-relaxed">
                계정으로 <span className="font-display font-bold text-brutal-yellow">로그인</span>
              </p>

              {authError && (
                <div className="border-3 border-red-500 bg-red-500/20 p-3 mb-6 flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} />
                  {authError}
                </div>
              )}

              <div className="mb-4">
                <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-2">
                  <Mail size={12} className="inline mr-1" />이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={inputClass}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-2">
                  <Lock size={12} className="inline mr-1" />비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className={inputClass}
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={!email.trim() || !password.trim() || isLoading}
                className="w-full bg-brutal-yellow text-brutal-black font-display font-bold text-lg uppercase tracking-wider py-4 px-6 border-4 border-brutal-black shadow-brutal-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={!isLoading ? { y: -2, boxShadow: '6px 6px 0px #000000' } : undefined}
                whileTap={!isLoading ? { y: 2, x: 2, boxShadow: '0px 0px 0px #000000' } : undefined}
              >
                {isLoading && <Loader2 size={20} className="animate-spin" />}
                로그인
              </motion.button>
            </motion.form>
          )}

          {/* API Register */}
          {mode === 'register' && (
            <motion.form
              key="register"
              className="border-4 border-brutal-white bg-brutal-card p-8 shadow-brutal-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleApiRegister}
            >
              <p className="text-brutal-white text-center font-body mb-8 text-lg leading-relaxed">
                새 계정 <span className="font-display font-bold text-brutal-yellow">만들기</span>
              </p>

              {authError && (
                <div className="border-3 border-red-500 bg-red-500/20 p-3 mb-6 flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} />
                  {authError}
                </div>
              )}

              <div className="mb-4">
                <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className={inputClass}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-2">
                  <Mail size={12} className="inline mr-1" />이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={inputClass}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block font-display font-bold text-brutal-yellow text-xs uppercase tracking-wider mb-2">
                  <Lock size={12} className="inline mr-1" />비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (8자 이상)"
                  className={inputClass}
                  minLength={8}
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={!email.trim() || !password.trim() || !displayName.trim() || isLoading}
                className="w-full bg-brutal-yellow text-brutal-black font-display font-bold text-lg uppercase tracking-wider py-4 px-6 border-4 border-brutal-black shadow-brutal-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={!isLoading ? { y: -2, boxShadow: '6px 6px 0px #000000' } : undefined}
                whileTap={!isLoading ? { y: 2, x: 2, boxShadow: '0px 0px 0px #000000' } : undefined}
              >
                {isLoading && <Loader2 size={20} className="animate-spin" />}
                회원가입
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

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
