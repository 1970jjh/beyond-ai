import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'
import { useUIStore, type Toast } from '../../stores/uiStore'

const TOAST_ICONS: Record<Toast['type'], typeof Info> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_STYLES: Record<Toast['type'], string> = {
  success: 'bg-brutal-green text-brutal-white border-brutal-green',
  error: 'bg-brutal-red text-brutal-white border-brutal-red',
  warning: 'bg-brutal-orange text-brutal-white border-brutal-orange',
  info: 'bg-brutal-black text-brutal-white border-brutal-white',
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type]
          return (
            <motion.div
              key={toast.id}
              className={`brutal-border p-4 shadow-brutal flex items-center gap-3 ${TOAST_STYLES[toast.type]}`}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Icon size={20} className="shrink-0" />
              <span className="font-display font-bold text-sm flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 hover:bg-brutal-white/20 cursor-pointer bg-transparent border-none text-current"
              >
                <X size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
