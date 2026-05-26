import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db, SessionLocal
from models import Tutorial
from schemas import TutorialOut, TutorialStepOut

router = APIRouter(prefix="/api/tutorials", tags=["tutorials"])


def _build_tutorial_out(tutorial: Tutorial) -> TutorialOut:
    steps = []
    for s in tutorial.steps:
        steps.append(TutorialStepOut(
            id=s.id,
            step_number=s.step_number,
            title=s.title,
            description=s.description,
            timestamp_start=s.timestamp_start,
            timestamp_end=s.timestamp_end,
            keyframe_url=s.keyframe_path,
            tips=s.tips or [],
            warnings=s.warnings or [],
            tools_detected=s.tools_detected or [],
            difficulty=s.difficulty,
        ))

    video_url = None
    if tutorial.video_path:
        from pathlib import Path
        p = Path(tutorial.video_path)
        if p.exists():
            video_url = f"uploads/{p.name}"

    return TutorialOut(
        id=tutorial.id,
        title=tutorial.title,
        description=tutorial.description,
        video_url=video_url,
        youtube_url=tutorial.youtube_url,
        duration=tutorial.duration,
        status=tutorial.status,
        progress=tutorial.progress,
        current_stage=tutorial.current_stage,
        error_message=tutorial.error_message,
        steps=steps,
        created_at=tutorial.created_at,
        completed_at=tutorial.completed_at,
    )


@router.get("", response_model=list[TutorialOut])
async def list_tutorials(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tutorial).options(selectinload(Tutorial.steps)).order_by(Tutorial.created_at.desc())
    )
    tutorials = result.scalars().all()
    return [_build_tutorial_out(t) for t in tutorials]


@router.get("/{tutorial_id}", response_model=TutorialOut)
async def get_tutorial(tutorial_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Tutorial).options(selectinload(Tutorial.steps)).where(Tutorial.id == tutorial_id)
    )
    tutorial = result.scalar_one_or_none()
    if not tutorial:
        raise HTTPException(404, "Tutorial not found")
    return _build_tutorial_out(tutorial)


@router.get("/{tutorial_id}/stream")
async def stream_progress(tutorial_id: str):
    """SSE endpoint for real-time processing progress."""
    async def generate() -> AsyncGenerator[str, None]:
        while True:
            async with SessionLocal() as sess:
                result = await sess.execute(select(Tutorial).where(Tutorial.id == tutorial_id))
                tutorial = result.scalar_one_or_none()
                if not tutorial:
                    yield f"data: {json.dumps({'status': 'error', 'progress': 0, 'current_stage': None, 'error_message': 'Not found'})}\n\n"
                    return

                payload = json.dumps({
                    "status": tutorial.status,
                    "progress": tutorial.progress,
                    "current_stage": tutorial.current_stage,
                    "error_message": tutorial.error_message,
                })
                yield f"data: {payload}\n\n"

                if tutorial.status in ("complete", "error"):
                    return

            await asyncio.sleep(1.5)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
