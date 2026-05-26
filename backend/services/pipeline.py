import asyncio
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import UPLOAD_DIR, KEYFRAME_DIR
from models import Tutorial, TutorialStep, new_id
from services.video_utils import get_duration, extract_audio, normalize_video
from services.transcription import transcribe_audio
from services.scene_detector import detect_scenes
from services.keyframe_extractor import extract_keyframes
from services.instruction_generator import generate_instructions


async def update_status(
    db: AsyncSession,
    tutorial_id: str,
    status: str,
    progress: int,
    current_stage: str | None = None,
    error_message: str | None = None,
):
    result = await db.execute(select(Tutorial).where(Tutorial.id == tutorial_id))
    tutorial = result.scalar_one_or_none()
    if tutorial:
        tutorial.status = status
        tutorial.progress = progress
        tutorial.current_stage = current_stage
        if error_message:
            tutorial.error_message = error_message
        if status == "complete":
            tutorial.completed_at = datetime.utcnow()
        await db.commit()


async def run_pipeline(tutorial_id: str, db: AsyncSession):
    """Main processing pipeline for a tutorial."""
    try:
        result = await db.execute(select(Tutorial).where(Tutorial.id == tutorial_id))
        tutorial = result.scalar_one_or_none()
        if not tutorial:
            return

        video_path = Path(tutorial.video_path) if tutorial.video_path else None

        # Stage 1: Ingest
        await update_status(db, tutorial_id, "ingesting", 5, "Normalizing video")
        if video_path and video_path.exists():
            norm_path = video_path.with_suffix(".norm.mp4")
            await normalize_video(video_path, norm_path)
            if norm_path.exists():
                video_path = norm_path
                tutorial.video_path = str(norm_path)
                await db.commit()

        duration = await get_duration(video_path) if video_path else 0.0
        if duration > 0:
            tutorial.duration = duration
            await db.commit()

        # Stage 2: Extract audio
        await update_status(db, tutorial_id, "extracting_audio", 15, "Extracting audio")
        audio_path = None
        if video_path and video_path.exists():
            audio_path = video_path.with_suffix(".wav")
            ok = await extract_audio(video_path, audio_path)
            if not ok:
                audio_path = None

        # Stage 3: Transcribe
        await update_status(db, tutorial_id, "transcribing", 30, "Transcribing speech")
        transcript_segments = []
        if audio_path and audio_path.exists():
            transcript_segments = await transcribe_audio(audio_path)

        # Stage 4: Scene detection
        await update_status(db, tutorial_id, "detecting_scenes", 50, "Detecting scenes")
        scenes = []
        if video_path and video_path.exists():
            scenes = await detect_scenes(video_path)

        if not scenes and duration > 0:
            # Fallback: split into equal segments
            seg_count = max(3, min(10, int(duration / 30)))
            seg_dur = duration / seg_count
            scenes = [
                {"start_time": i * seg_dur, "end_time": (i + 1) * seg_dur}
                for i in range(seg_count)
            ]

        # Stage 5: Extract keyframes
        await update_status(db, tutorial_id, "extracting_keyframes", 65, "Extracting keyframes")
        timestamps = [s["start_time"] for s in scenes]
        keyframe_map = {}
        if video_path and video_path.exists() and timestamps:
            keyframe_map = await extract_keyframes(video_path, timestamps[:20], tutorial_id)

        # Stage 6: Generate instructions
        await update_status(db, tutorial_id, "generating_instructions", 80, "AI generating instructions")
        instructions = await generate_instructions(
            transcript_segments, scenes, duration, tutorial.title
        )

        # Stage 7: Assemble
        await update_status(db, tutorial_id, "assembling", 93, "Assembling tutorial")
        tutorial.title = instructions.get("title", tutorial.title)
        tutorial.description = instructions.get("description", "")

        for step_data in instructions.get("steps", []):
            ts_start = float(step_data.get("timestamp_start", 0))
            keyframe = keyframe_map.get(
                min(keyframe_map.keys(), key=lambda k: abs(k - ts_start))
                if keyframe_map else ts_start,
                None,
            )
            step = TutorialStep(
                id=new_id(),
                tutorial_id=tutorial_id,
                step_number=int(step_data.get("step_number", 1)),
                title=str(step_data.get("title", "Step")),
                description=str(step_data.get("description", "")),
                timestamp_start=ts_start,
                timestamp_end=float(step_data.get("timestamp_end", ts_start + 30)),
                keyframe_path=keyframe,
                tips=step_data.get("tips", []),
                warnings=step_data.get("warnings", []),
                tools_detected=step_data.get("tools_detected", []),
                difficulty=step_data.get("difficulty"),
            )
            db.add(step)

        await db.commit()
        await update_status(db, tutorial_id, "complete", 100, None)

        # Clean up temp audio
        if audio_path and audio_path.exists():
            audio_path.unlink(missing_ok=True)

    except Exception as e:
        import traceback
        traceback.print_exc()
        await update_status(db, tutorial_id, "error", 0, None, str(e))
