import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
KEYFRAME_DIR = Path(os.getenv("KEYFRAME_DIR", "./keyframes"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./visionflow.db")
MAX_VIDEO_SIZE_MB = int(os.getenv("MAX_VIDEO_SIZE_MB", "2048"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
KEYFRAME_DIR.mkdir(parents=True, exist_ok=True)
