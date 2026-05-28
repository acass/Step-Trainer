# VisionFlow AI

An AI-powered video-to-tutorial converter. Drop in any video or paste a YouTube URL and VisionFlow automatically generates a structured, step-by-step tutorial complete with keyframe images, transcribed speech, tips, warnings, and difficulty ratings.

<img width="674" height="770" alt="Screenshot 2026-05-27 at 6 47 27 PM" src="https://github.com/user-attachments/assets/6297191c-54d8-4436-bf7b-11bffa92c001" />

## How It Works

VisionFlow processes videos through an 8-stage pipeline:

1. **Ingest** — Normalize video with FFmpeg
2. **Extract Audio** — Isolate audio track (16kHz mono WAV)
3. **Transcribe** — Speech-to-text via OpenAI Whisper with timestamps
4. **Detect Scenes** — Automatic scene boundary detection with PySceneDetect
5. **Extract Keyframes** — Capture representative frames via OpenCV (up to 20)
6. **Generate Instructions** — Claude AI synthesizes transcript + scenes into structured tutorial steps
7. **Assemble** — Build final tutorial with metadata, tips, tools, and difficulty levels
8. **Complete** — Tutorial ready for viewing and export

Real-time progress is streamed to the frontend via Server-Sent Events (SSE).

---

## Features

- Upload video files directly or submit a YouTube URL
- Real-time processing progress with per-stage status indicators
- Interactive tutorial viewer with synchronized video player and step sidebar
- Timeline navigation by step
- Export tutorials as **JSON**, **Markdown**, or **PDF**
- Each step includes: title, description, timestamps, keyframe image, tips, warnings, detected tools, and difficulty level

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11, SQLAlchemy (async), SQLite |
| AI/ML | Anthropic Claude (instruction generation), OpenAI Whisper (transcription) |
| Video | FFmpeg, PySceneDetect, OpenCV, yt-dlp |
| Export | fpdf2, Pillow |
| Infra | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- An [Anthropic API key](https://console.anthropic.com/)
- An [OpenAI API key](https://platform.openai.com/)

### 1. Clone and configure

```bash
git clone <repo-url>
cd Step-Trainer
cp .env.example .env
```

Edit `.env` and fill in your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
```

### 2. Start the stack

```bash
docker-compose up
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### 3. Use it

1. Open http://localhost:3000
2. Upload a video file or paste a YouTube URL
3. Watch the pipeline process in real time
4. View, navigate, and export your tutorial

---

## Manual Setup (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

> FFmpeg must be installed and available on your `PATH` for local runs.

---

## Environment Variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Claude API key for instruction generation |
| `OPENAI_API_KEY` | Yes | — | OpenAI key for Whisper transcription |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./visionflow.db` | Database connection string |
| `UPLOAD_DIR` | No | `./uploads` | Directory for uploaded videos |
| `KEYFRAME_DIR` | No | `./keyframes` | Directory for extracted keyframe images |
| `MAX_VIDEO_SIZE_MB` | No | `2048` | Maximum upload file size in MB |

### Frontend (`.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000` | Backend API base URL |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload a video file (multipart/form-data) |
| `POST` | `/api/upload/youtube` | Submit a YouTube URL (JSON body) |
| `GET` | `/api/tutorials` | List all tutorials |
| `GET` | `/api/tutorials/{id}` | Get a tutorial with full step details |
| `GET` | `/api/tutorials/{id}/stream` | SSE stream for real-time progress |
| `GET` | `/api/tutorials/{id}/export?format=json\|markdown\|pdf` | Export a tutorial |
| `GET` | `/health` | Health check |

Full interactive docs at `/docs` (Swagger UI) when the backend is running.

---

## Project Structure

```
.
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── main.py                    # FastAPI app, CORS, route registration
│   ├── config.py                  # Config and path setup
│   ├── database.py                # Async SQLAlchemy setup
│   ├── models.py                  # Tutorial & TutorialStep ORM models
│   ├── schemas.py                 # Pydantic schemas
│   ├── routers/
│   │   ├── upload.py              # Upload endpoints
│   │   ├── tutorials.py           # Tutorial read + SSE stream
│   │   └── export.py              # Export endpoints
│   └── services/
│       ├── pipeline.py            # 8-stage orchestration
│       ├── video_utils.py         # FFmpeg wrappers
│       ├── transcription.py       # Whisper integration
│       ├── scene_detector.py      # PySceneDetect
│       ├── keyframe_extractor.py  # OpenCV frame capture
│       ├── instruction_generator.py # Claude API integration
│       ├── exporter.py            # JSON/Markdown/PDF export
│       └── yt_downloader.py       # yt-dlp wrapper
└── frontend/
    ├── app/
    │   ├── page.tsx               # Home / upload page
    │   └── tutorial/[id]/page.tsx # Tutorial viewer
    ├── components/
    │   ├── VideoUploader.tsx
    │   ├── ProgressTracker.tsx
    │   ├── TutorialViewer.tsx
    │   ├── VideoPlayer.tsx
    │   ├── StepCard.tsx
    │   ├── Timeline.tsx
    │   └── ExportMenu.tsx
    └── lib/
        ├── api.ts
        ├── types.ts
        └── utils.ts
```

---

## License

MIT
