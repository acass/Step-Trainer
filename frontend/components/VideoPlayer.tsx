'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { api } from '@/lib/api'

export interface VideoPlayerHandle {
  seekTo: (seconds: number) => void
  getCurrentTime: () => number
}

interface VideoPlayerProps {
  videoUrl: string
  youtubeUrl: string | null
  onTimeUpdate?: (time: number) => void
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ videoUrl, youtubeUrl, onTimeUpdate }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = seconds
          videoRef.current.play().catch(() => {})
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    }))

    useEffect(() => {
      const video = videoRef.current
      if (!video || !onTimeUpdate) return
      const handler = () => onTimeUpdate(video.currentTime)
      video.addEventListener('timeupdate', handler)
      return () => video.removeEventListener('timeupdate', handler)
    }, [onTimeUpdate])

    if (youtubeUrl) {
      const videoId = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]
      if (videoId) {
        return (
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
    }

    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          src={api.getVideoUrl(videoUrl)}
          controls
          className="w-full h-full object-contain"
          playsInline
        />
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'
