'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { PROCESSING_STAGES, type ProcessingStatus } from '@/lib/types'
import { api } from '@/lib/api'

interface ProgressTrackerProps {
  tutorialId: string
  onComplete: () => void
  onError: (msg: string) => void
}

interface ProgressEvent {
  status: ProcessingStatus
  progress: number
  current_stage: string | null
  error_message: string | null
}

export function ProgressTracker({ tutorialId, onComplete, onError }: ProgressTrackerProps) {
  const [currentStatus, setCurrentStatus] = useState<ProcessingStatus>('queued')
  const [progress, setProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const url = api.getProgressStreamUrl(tutorialId)
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (e) => {
      try {
        const data: ProgressEvent = JSON.parse(e.data)
        setCurrentStatus(data.status)
        setProgress(data.progress)
        setCurrentStage(data.current_stage)

        if (data.status === 'complete') {
          es.close()
          setTimeout(onComplete, 1000)
        } else if (data.status === 'error') {
          es.close()
          onError(data.error_message || 'Processing failed')
        }
      } catch {}
    }

    es.onerror = () => {
      // Reconnect is handled by browser, but if already complete ignore
    }

    return () => es.close()
  }, [tutorialId, onComplete, onError])

  const stageIndex = PROCESSING_STAGES.findIndex((s) => s.id === currentStatus)
  const activeStage = PROCESSING_STAGES.find((s) => s.id === currentStatus)

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600/20 border border-brand-600/30 rounded-full text-brand-400 text-sm font-medium mb-4"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Sparkles size={14} />
          AI is analyzing your video
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Generating your tutorial</h2>
        <p className="text-zinc-400 text-sm">
          {activeStage?.description || 'Processing...'}
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Overall progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2.5">
          <motion.div
            className="bg-gradient-to-r from-brand-600 to-brand-400 h-2.5 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {PROCESSING_STAGES.map((stage, idx) => {
          const isComplete = idx < stageIndex || currentStatus === 'complete'
          const isActive = stage.id === currentStatus
          const isPending = idx > stageIndex && currentStatus !== 'complete'

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'border-brand-500/50 bg-brand-500/10'
                  : isComplete
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              <div className="shrink-0">
                {isComplete ? (
                  <CheckCircle2 size={20} className="text-green-400" />
                ) : isActive ? (
                  <Loader2 size={20} className="text-brand-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-white' : isComplete ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {stage.label}
                </p>
              </div>
              {isComplete && (
                <span className="text-xs text-green-500 font-medium">Done</span>
              )}
              {isActive && (
                <span className="text-xs text-brand-400 font-medium">Running</span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
