'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Link, Film, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { UploadResponse } from '@/lib/types'

interface VideoUploaderProps {
  onSuccess: (response: UploadResponse) => void
}

type Tab = 'upload' | 'youtube'

export function VideoUploader({ onSuccess }: VideoUploaderProps) {
  const [tab, setTab] = useState<Tab>('upload')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return
    const file = accepted[0]
    setError(null)
    setUploading(true)
    setUploadProgress(0)
    try {
      const res = await api.uploadVideo(file, setUploadProgress)
      setUploaded(true)
      setTimeout(() => onSuccess(res), 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setUploading(false)
    }
  }, [onSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/webm': ['.webm'] },
    maxSize: 2 * 1024 * 1024 * 1024,
    maxFiles: 1,
    disabled: uploading || uploaded,
  })

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl.trim()) return
    setError(null)
    setUploading(true)
    try {
      const res = await api.submitYouTubeUrl(youtubeUrl.trim())
      setUploaded(true)
      setTimeout(() => onSuccess(res), 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process URL')
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-surface-800 rounded-xl">
        {(['upload', 'youtube'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200',
              tab === t
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            {t === 'upload' ? <Upload size={16} /> : <Link size={16} />}
            {t === 'upload' ? 'Upload Video' : 'YouTube URL'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
                isDragActive
                  ? 'border-brand-500 bg-brand-500/10 scale-[1.02]'
                  : uploaded
                  ? 'border-green-500 bg-green-500/5 cursor-default'
                  : uploading
                  ? 'border-slate-600 bg-slate-800/50 cursor-wait'
                  : 'border-slate-700 bg-slate-900/50 hover:border-brand-500/50 hover:bg-brand-500/5'
              )}
            >
              <input {...getInputProps()} />

              {uploaded ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <CheckCircle2 size={48} className="text-green-400" />
                  <p className="text-lg font-medium text-green-400">Upload complete!</p>
                  <p className="text-sm text-slate-400">Starting AI analysis...</p>
                </motion.div>
              ) : uploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 size={48} className="text-brand-500 animate-spin" />
                  <p className="text-lg font-medium text-white">Uploading...</p>
                  <div className="w-full max-w-xs bg-slate-700 rounded-full h-2">
                    <motion.div
                      className="bg-brand-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-slate-400">{uploadProgress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300',
                    isDragActive ? 'bg-brand-500/20' : 'bg-slate-800'
                  )}>
                    {isDragActive ? (
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                        <Film size={40} className="text-brand-400" />
                      </motion.div>
                    ) : (
                      <Upload size={40} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white mb-1">
                      {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                    </p>
                    <p className="text-sm text-slate-400">
                      or <span className="text-brand-400 underline underline-offset-2">browse files</span>
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">MP4, MOV, WebM · Up to 2GB</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="youtube"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleYouTubeSubmit} className="space-y-4">
              <div className="relative">
                <Link size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={uploading || uploaded}
                  className="w-full pl-11 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!youtubeUrl.trim() || uploading || uploaded}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing URL...</>
                ) : uploaded ? (
                  <><CheckCircle2 size={18} /> URL Submitted!</>
                ) : (
                  <>Generate Tutorial</>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
