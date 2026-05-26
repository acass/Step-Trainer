export type ProcessingStatus =
  | 'queued'
  | 'ingesting'
  | 'extracting_audio'
  | 'transcribing'
  | 'detecting_scenes'
  | 'extracting_keyframes'
  | 'generating_instructions'
  | 'assembling'
  | 'complete'
  | 'error'

export interface ProcessingStage {
  id: ProcessingStatus
  label: string
  description: string
}

export const PROCESSING_STAGES: ProcessingStage[] = [
  { id: 'ingesting', label: 'Ingesting Video', description: 'Normalizing and preparing your video...' },
  { id: 'extracting_audio', label: 'Extracting Audio', description: 'Isolating the audio track...' },
  { id: 'transcribing', label: 'Transcribing', description: 'Converting speech to text...' },
  { id: 'detecting_scenes', label: 'Detecting Scenes', description: 'Identifying scene boundaries and transitions...' },
  { id: 'extracting_keyframes', label: 'Extracting Keyframes', description: 'Capturing representative frames...' },
  { id: 'generating_instructions', label: 'Generating Instructions', description: 'AI is analyzing and writing your tutorial...' },
  { id: 'assembling', label: 'Assembling Tutorial', description: 'Putting everything together...' },
]

export interface TutorialStep {
  id: string
  step_number: number
  title: string
  description: string
  timestamp_start: number
  timestamp_end: number
  keyframe_url: string | null
  tips: string[]
  warnings: string[]
  tools_detected: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
}

export interface Tutorial {
  id: string
  title: string
  description: string
  video_url: string | null
  youtube_url: string | null
  duration: number
  status: ProcessingStatus
  progress: number
  current_stage: string | null
  error_message: string | null
  steps: TutorialStep[]
  created_at: string
  completed_at: string | null
}

export interface UploadResponse {
  tutorial_id: string
  status: ProcessingStatus
  message: string
}
