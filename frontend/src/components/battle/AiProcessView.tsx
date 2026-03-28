import { motion } from 'framer-motion'
import { Brain, Check, Loader, Clock } from 'lucide-react'
import type { AiProcessStep } from '../../types'

interface AiProcessViewProps {
  readonly steps: ReadonlyArray<AiProcessStep>
}

const statusIcon = {
  pending: Clock,
  active: Loader,
  done: Check,
} as const

export function AiProcessView({ steps }: AiProcessViewProps) {
  return (
    <div className="brutal-border bg-brutal-black text-brutal-white p-6 shadow-brutal">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="text-brutal-yellow" size={24} />
        <h3 className="font-display font-bold text-lg uppercase text-brutal-yellow">
          AI 사고 과정
        </h3>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = statusIcon[step.status]

          return (
            <motion.div
              key={step.id}
              className="flex gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="flex flex-col items-center">
                <div className={`p-2 border-2 ${
                  step.status === 'done' ? 'border-brutal-green bg-brutal-green/20' :
                  step.status === 'active' ? 'border-brutal-yellow bg-brutal-yellow/20' :
                  'border-brutal-gray bg-brutal-gray/20'
                }`}>
                  <Icon
                    size={16}
                    className={step.status === 'active' ? 'animate-spin text-brutal-yellow' : step.status === 'done' ? 'text-brutal-green' : 'text-brutal-gray'}
                  />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 h-8 ${step.status === 'done' ? 'bg-brutal-green' : 'bg-brutal-gray'}`} />
                )}
              </div>

              <div className="flex-1 pb-4">
                <div className="font-display font-bold text-sm uppercase">
                  {step.label}
                </div>
                <div className="text-brutal-gray text-sm mt-1 font-mono">
                  {step.description}
                </div>
                {step.output && (
                  <div className="mt-2 p-3 bg-brutal-gray/30 border border-brutal-gray font-mono text-xs whitespace-pre-wrap">
                    {step.output}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
