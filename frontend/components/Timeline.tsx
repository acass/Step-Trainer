'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { formatDuration } from '@/lib/utils'
import type { TutorialStep } from '@/lib/types'

interface TimelineProps {
  steps: TutorialStep[]
  duration: number
  currentTime: number
  activeStepIndex: number
  onSeek: (time: number) => void
  onStepClick: (index: number) => void
}

export function Timeline({ steps, duration, currentTime, activeStepIndex, onSeek, onStepClick }: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = (e.clientX - rect.left) / rect.width
    onSeek(Math.max(0, Math.min(duration, pct * duration)))
  }, [duration, onSeek])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full py-4">
      {/* Time display */}
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleClick}
        className="relative w-full h-2 bg-slate-800 rounded-full cursor-pointer group"
      >
        {/* Progress */}
        <div
          className="absolute left-0 top-0 h-full bg-brand-500 rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />

        {/* Step markers */}
        {steps.map((step, idx) => {
          const pct = duration > 0 ? (step.timestamp_start / duration) * 100 : 0
          return (
            <motion.button
              key={step.id}
              title={`Step ${step.step_number}: ${step.title}`}
              onClick={(e) => { e.stopPropagation(); onStepClick(idx) }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${pct}%` }}
              whileHover={{ scale: 1.5 }}
            >
              <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                idx === activeStepIndex
                  ? 'bg-brand-400 border-brand-300'
                  : idx < activeStepIndex
                  ? 'bg-brand-700 border-brand-600'
                  : 'bg-slate-700 border-slate-500 group-hover:border-slate-400'
              }`} />
            </motion.button>
          )
        })}

        {/* Playhead */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none"
          style={{ left: `${progressPct}%` }}
        />
      </div>

      {/* Step labels below */}
      <div className="relative h-6 mt-2">
        {steps.slice(0, 8).map((step, idx) => {
          const pct = duration > 0 ? (step.timestamp_start / duration) * 100 : 0
          return (
            <span
              key={step.id}
              className="absolute text-xs text-slate-500 -translate-x-1/2 whitespace-nowrap hidden sm:block"
              style={{ left: `${pct}%` }}
            >
              {step.step_number}
            </span>
          )
        })}
      </div>
    </div>
  )
}
