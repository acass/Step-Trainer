import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db, SessionLocal
from models import Tutorial, new_id
from schemas import UploadResponse, YouTubeRequest
from config import UPLOAD_DIR, MAX_VIDEO_SIZE_MB
from services.pipeline import run_pipeline

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi"}


async def _start_pipeline(tutorial_id: str):
    async with SessionLocal() as db:
        await run_pipeline(tutorial_id, db)


async def _start_pipeline_yt(tutorial_id: str, url: str):
    from services.yt_downloader import download_youtube
    from sqlalchemy import select

    async with SessionLocal() as db:
        result = await db.execute(select(Tutorial).where(Tutorial.id == tutorial_id))
        tutorial = result.scalar_one_or_none()
        if tutorial:
            try:
                video_path, title = await download_youtube(url)
                tutorial.video_path = str(video_path)
                tutorial.title = title
                await db.commit()
            except Exception as e:
                tutorial.status = "error"
                tutorial.error_message = f"Download failed: {e}"
                await db.commit()
                return
        await run_pipeline(tutorial_id, db)


@router.post("", response_model=UploadResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    suffix = Path(file.filename or "video.mp4").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Unsupported file type. Use MP4, MOV, or WebM.")

    file_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{file_id}{suffix}"

    try:
        with open(save_path, "wb") as f:
            chunk_size = 1024 * 1024
            total = 0
            while chunk := await file.read(chunk_size):
                total += len(chunk)
                if total > MAX_VIDEO_SIZE_MB * 1024 * 1024:
                    save_path.unlink(missing_ok=True)
                    raise HTTPException(413, f"File too large. Max {MAX_VIDEO_SIZE_MB}MB.")
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(500, f"Upload failed: {e}")

    tutorial = Tutorial(
        id=new_id(),
        title=Path(file.filename or "video").stem.replace("-", " ").replace("_", " ").title(),
        video_path=str(save_path),
        status="queued",
        progress=0,
    )
    db.add(tutorial)
    await db.commit()

    background_tasks.add_task(_start_pipeline, tutorial.id)

    return UploadResponse(
        tutorial_id=tutorial.id,
        status="queued",
        message="Upload successful. Processing started.",
    )


@router.post("/youtube", response_model=UploadResponse)
async def upload_youtube(
    request: YouTubeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    url = request.url.strip()
    if "youtube.com" not in url and "youtu.be" not in url:
        raise HTTPException(400, "Please provide a valid YouTube URL.")

    tutorial = Tutorial(
        id=new_id(),
        title="YouTube Tutorial",
        youtube_url=url,
        status="queued",
        progress=0,
    )
    db.add(tutorial)
    await db.commit()

    background_tasks.add_task(_start_pipeline_yt, tutorial.id, url)

    return UploadResponse(
        tutorial_id=tutorial.id,
        status="queued",
        message="YouTube URL received. Downloading and processing...",
    )
