'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileJson, FileText, FileDown, ChevronDown, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { downloadBlob } from '@/lib/utils'

interface ExportMenuProps {
  tutorialId: string
  tutorialTitle: string
}

type Format = 'json' | 'markdown' | 'pdf'

const formats: { id: Format; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'json', label: 'JSON', icon: <FileJson size={16} />, description: 'Structured data format' },
  { id: 'markdown', label: 'Markdown', icon: <FileText size={16} />, description: 'Readable text format' },
  { id: 'pdf', label: 'PDF', icon: <FileDown size={16} />, description: 'Print-ready document' },
]

export function ExportMenu({ tutorialId, tutorialTitle }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<Format | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = async (format: Format) => {
    setLoading(format)
    setOpen(false)
    try {
      const blob = await api.exportTutorial(tutorialId, format)
      const ext = format === 'markdown' ? 'md' : format
      downloadBlob(blob, `${tutorialTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`)
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-white transition-colors"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Export
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {formats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => handleExport(fmt.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-400">{fmt.icon}</span>
                <div>
                  <div className="font-medium text-white">{fmt.label}</div>
                  <div className="text-xs text-slate-500">{fmt.description}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
