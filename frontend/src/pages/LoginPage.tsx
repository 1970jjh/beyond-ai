import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-brutal-black flex items-center justify-center p-4">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanline z-10" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0, 0, 1] }}
      >
        {/* Logo */}
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

        {/* Login Card */}
        <motion.div
          className="border-4 border-brutal-white bg-brutal-card p-8 shadow-brutal-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-brutal-white text-center font-body mb-8 text-lg leading-relaxed">
            AI를 넘어서는
            <br />
            <span className="font-display font-bold text-brutal-yellow">진짜 실력</span>을 키우다
          </p>

          {/* Google OAuth Button */}
          <motion.button
            className="w-full bg-brutal-yellow text-brutal-black font-display font-bold text-lg uppercase tracking-wider py-4 px-6 border-4 border-brutal-black shadow-brutal-lg cursor-pointer flex items-center justify-center gap-3"
            whileHover={{ y: -2, boxShadow: '6px 6px 0px #000000' }}
            whileActive={{ y: 2, x: 2, boxShadow: '0px 0px 0px #000000' }}
            transition={{ duration: 0.1 }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 시작하기
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[2px] bg-brutal-gray" />
            <span className="font-mono text-xs text-brutal-gray uppercase tracking-wider">또는</span>
            <div className="flex-1 h-[2px] bg-brutal-gray" />
          </div>

          {/* Guest Entry */}
          <motion.button
            className="w-full bg-transparent text-brutal-white font-display font-bold uppercase tracking-wider py-3 px-6 border-3 border-brutal-white cursor-pointer flex items-center justify-center gap-3 hover:bg-brutal-white hover:text-brutal-black transition-colors"
            whileActive={{ y: 2, x: 2 }}
          >
            <LogIn size={20} />
            방 코드로 참여하기
          </motion.button>
        </motion.div>

        {/* Footer */}
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
