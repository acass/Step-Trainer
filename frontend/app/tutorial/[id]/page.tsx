'use client'

import { use, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowLeft, AlertCircle } from 'lucide-react'
import { ProgressTracker } from '@/components/ProgressTracker'
import { TutorialViewer } from '@/components/TutorialViewer'
import { api } from '@/lib/api'
import type { Tutorial } from '@/lib/types'

export default function TutorialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTutorial = useCallback(async () => {
    try {
      const t = await api.getTutorial(id)
      setTutorial(t)
    } catch (e) {
      setError('Tutorial not found')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchTutorial() }, [fetchTutorial])

  const handleComplete = useCallback(async () => {
    const t = await api.getTutorial(id)
    setTutorial(t)
  }, [id])

  const handleError = useCallback((msg: string) => {
    setError(msg)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-bold text-white">{error}</h2>
        <button onClick={() => router.push('/')} className="text-brand-400 hover:underline text-sm">
          Back to home
        </button>
      </div>
    )
  }

  const isProcessing = tutorial && tutorial.status !== 'complete' && tutorial.status !== 'error'

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50 px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            New tutorial
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">VisionFlow AI</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <ProgressTracker
                tutorialId={id}
                onComplete={handleComplete}
                onError={handleError}
              />
            </motion.div>
          ) : tutorial?.status === 'complete' ? (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <TutorialViewer tutorial={tutorial} />
            </motion.div>
          ) : tutorial?.status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <AlertCircle size={48} className="text-red-400" />
              <h2 className="text-xl font-bold text-white">Processing failed</h2>
              <p className="text-zinc-400 text-sm">{tutorial.error_message || 'An error occurred during processing'}</p>
              <button onClick={() => router.push('/')} className="text-brand-400 hover:underline text-sm">
                Try again
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}
