from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Tutorial
from services.exporter import export_json, export_markdown, export_pdf

router = APIRouter(prefix="/api/tutorials", tags=["export"])


@router.get("/{tutorial_id}/export")
async def export_tutorial(
    tutorial_id: str,
    format: str = Query("json", pattern="^(json|markdown|pdf)$"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tutorial).options(selectinload(Tutorial.steps)).where(Tutorial.id == tutorial_id)
    )
    tutorial = result.scalar_one_or_none()
    if not tutorial:
        raise HTTPException(404, "Tutorial not found")
    if tutorial.status != "complete":
        raise HTTPException(400, "Tutorial is not complete yet")

    safe_title = "".join(c if c.isalnum() or c in "-_ " else "" for c in tutorial.title)[:50].strip()

    if format == "json":
        content = export_json(tutorial)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.json"'},
        )
    elif format == "markdown":
        content = export_markdown(tutorial)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.md"'},
        )
    elif format == "pdf":
        content = export_pdf(tutorial)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.pdf"'},
        )
