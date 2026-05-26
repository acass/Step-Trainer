import type { Tutorial, UploadResponse } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  async uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(JSON.parse(xhr.responseText)?.detail || 'Upload failed'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
  },

  async submitYouTubeUrl(url: string): Promise<UploadResponse> {
    const res = await fetch(`${API_BASE}/api/upload/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to submit YouTube URL')
    }
    return res.json()
  },

  async getTutorial(id: string): Promise<Tutorial> {
    const res = await fetch(`${API_BASE}/api/tutorials/${id}`)
    if (!res.ok) throw new Error('Tutorial not found')
    return res.json()
  },

  async listTutorials(): Promise<Tutorial[]> {
    const res = await fetch(`${API_BASE}/api/tutorials`)
    if (!res.ok) throw new Error('Failed to fetch tutorials')
    return res.json()
  },

  getProgressStreamUrl(id: string): string {
    return `${API_BASE}/api/tutorials/${id}/stream`
  },

  async exportTutorial(id: string, format: 'json' | 'markdown' | 'pdf'): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/tutorials/${id}/export?format=${format}`)
    if (!res.ok) throw new Error('Export failed')
    return res.blob()
  },

  getKeyframeUrl(path: string): string {
    if (path.startsWith('http')) return path
    return `${API_BASE}/${path}`
  },

  getVideoUrl(path: string): string {
    if (path.startsWith('http')) return path
    return `${API_BASE}/${path}`
  },
}
