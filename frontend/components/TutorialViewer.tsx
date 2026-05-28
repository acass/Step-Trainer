'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, BookOpen, Film } from 'lucide-react'
import { VideoPlayer, type VideoPlayerHandle } from './VideoPlayer'
import { StepCard } from './StepCard'
import { Timeline } from './Timeline'
import { ExportMenu } from './ExportMenu'
import type { Tutorial } from '@/lib/types'
import { formatDuration } from '@/lib/utils'

interface TutorialViewerProps {
  tutorial: Tutorial
}

export function TutorialViewer({ tutorial }: TutorialViewerProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [view, setView] = useState<'split' | 'steps'>('split')
  const videoRef = useRef<VideoPlayerHandle>(null)
  const stepListRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  const steps = tutorial.steps

  // Update active step based on video time
  useEffect(() => {
    const newActive = steps.findLastIndex((s) => s.timestamp_start <= currentTime)
    if (newActive >= 0 && newActive !== activeStep) {
      setActiveStep(newActive)
    }
  }, [currentTime, steps])

  // Scroll active step into view in the list
  useEffect(() => {
    const el = stepRefs.current[activeStep]
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeStep])

  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= steps.length) return
    setActiveStep(index)
    videoRef.current?.seekTo(steps[index].timestamp_start)
  }, [steps])

  const handleSeek = useCallback((time: number) => {
    videoRef.current?.seekTo(time)
  }, [])

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">{tutorial.title}</h1>
          <p className="text-slate-400 text-sm mt-1">{tutorial.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Film size={12} /> {formatDuration(tutorial.duration)}</span>
            <span className="flex items-center gap-1"><BookOpen size={12} /> {steps.length} steps</span>
          </div>
        </div>
        <ExportMenu tutorialId={tutorial.id} tutorialTitle={tutorial.title} />
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-xl w-fit">
        {(['split', 'steps'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === v ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {v === 'split' ? 'Video + Steps' : 'Steps Only'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={`flex gap-6 flex-1 min-h-0 ${view === 'split' ? 'lg:flex-row flex-col' : 'flex-col'}`}>
        {/* Video column */}
        {view === 'split' && (
          <div className="lg:w-[55%] flex flex-col gap-4">
            <VideoPlayer
              ref={videoRef}
              videoUrl={tutorial.video_url || ''}
              youtubeUrl={tutorial.youtube_url}
              onTimeUpdate={setCurrentTime}
            />
            <Timeline
              steps={steps}
              duration={tutorial.duration}
              currentTime={currentTime}
              activeStepIndex={activeStep}
              onSeek={handleSeek}
              onStepClick={goToStep}
            />
          </div>
        )}

        {/* Steps column */}
        <div className={`flex flex-col flex-1 min-h-0 ${view === 'split' ? 'lg:w-[45%]' : 'w-full'}`}>
          {/* Navigation controls */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400 font-medium">
              Step {activeStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => goToStep(activeStep - 1)}
                disabled={activeStep === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => goToStep(activeStep + 1)}
                disabled={activeStep === steps.length - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Step list */}
          <div ref={stepListRef} className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
            {steps.map((step, idx) => (
              <div key={step.id} ref={(el) => { stepRefs.current[idx] = el }}>
                <StepCard
                  step={step}
                  isActive={idx === activeStep}
                  onClick={() => goToStep(idx)}
                  compact={view === 'split'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
