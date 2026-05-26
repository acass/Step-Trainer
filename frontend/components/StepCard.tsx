'use client'

import { motion } from 'framer-motion'
import { Clock, Lightbulb, AlertTriangle, Wrench, ChevronRight } from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import type { TutorialStep } from '@/lib/types'
import { api } from '@/lib/api'

interface StepCardProps {
  step: TutorialStep
  isActive: boolean
  onClick: () => void
  compact?: boolean
}

export function StepCard({ step, isActive, onClick, compact = false }: StepCardProps) {
  const difficultyColors = {
    beginner: 'text-green-400 bg-green-400/10',
    intermediate: 'text-yellow-400 bg-yellow-400/10',
    advanced: 'text-red-400 bg-red-400/10',
  }

  return (
    <motion.div
      layout
      onClick={onClick}
      className={cn(
        'group relative border rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden',
        isActive
          ? 'step-active border-brand-500/60 shadow-lg shadow-brand-500/10'
          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeStep"
          className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent pointer-events-none"
        />
      )}

      <div className={cn('p-4', compact ? 'p-3' : 'p-5')}>
        <div className="flex gap-4">
          {/* Step number badge */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
            isActive ? 'bg-brand-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
          )}>
            {step.step_number}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={cn(
              'font-semibold text-white mb-1 leading-tight',
              compact ? 'text-sm' : 'text-base'
            )}>
              {step.title}
            </h3>

            {/* Timestamp */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-3">
              <Clock size={11} />
              <span>{formatDuration(step.timestamp_start)}</span>
              {step.timestamp_end > step.timestamp_start && (
                <>
                  <ChevronRight size={10} />
                  <span>{formatDuration(step.timestamp_end)}</span>
                </>
              )}
            </div>

            {/* Description */}
            {!compact && (
              <p className="text-sm text-zinc-400 leading-relaxed mb-4 line-clamp-3">
                {step.description}
              </p>
            )}

            {/* Keyframe */}
            {step.keyframe_url && !compact && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-zinc-800">
                <img
                  src={api.getKeyframeUrl(step.keyframe_url)}
                  alt={`Step ${step.step_number} visual`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Badges */}
            {!compact && (
              <div className="flex flex-wrap gap-2">
                {step.difficulty && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficultyColors[step.difficulty])}>
                    {step.difficulty}
                  </span>
                )}
                {step.tools_detected.map((tool) => (
                  <span key={tool} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 flex items-center gap-1">
                    <Wrench size={10} />
                    {tool}
                  </span>
                ))}
              </div>
            )}

            {/* Tips */}
            {!compact && step.tips.length > 0 && (
              <div className="mt-4 space-y-2">
                {step.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-yellow-400/80 bg-yellow-400/5 rounded-lg p-2.5">
                    <Lightbulb size={12} className="shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {!compact && step.warnings.length > 0 && (
              <div className="mt-2 space-y-2">
                {step.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-red-400/80 bg-red-400/5 rounded-lg p-2.5">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
