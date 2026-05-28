'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Zap, BookOpen, Download } from 'lucide-react'
import { VideoUploader } from '@/components/VideoUploader'
import type { UploadResponse } from '@/lib/types'

const features = [
  { icon: Zap, label: 'AI-Powered Analysis', description: 'Automatically detects scenes and key moments' },
  { icon: BookOpen, label: 'Step-by-Step Guides', description: 'Structured tutorials with images and timestamps' },
  { icon: Download, label: 'Multiple Exports', description: 'Export to PDF, Markdown, JSON, and more' },
]

export default function HomePage() {
  const router = useRouter()

  const handleUploadSuccess = (response: UploadResponse) => {
    router.push(`/tutorial/${response.tutorial_id}`)
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg">VisionFlow <span className="text-brand-400">AI</span></span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/15 border border-brand-600/25 text-brand-400 text-sm font-medium mb-6">
            <Sparkles size={14} />
            AI-Powered Video to Tutorial
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
            Turn any video into a{' '}
            <span className="bg-gradient-to-r from-brand-400 to-sky-300 bg-clip-text text-transparent">
              step-by-step training guide
            </span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            Upload a video or paste a YouTube link. VisionFlow AI analyzes the content,
            detects key moments, and generates a structured tutorial — automatically.
          </p>
        </motion.div>

        {/* Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <VideoUploader onSuccess={handleUploadSuccess} />
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-3xl w-full"
        >
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-800 bg-slate-900/30"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-600/15 flex items-center justify-center mb-3">
                <f.icon size={22} className="text-brand-400" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{f.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
