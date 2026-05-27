import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def new_id() -> str:
    return str(uuid.uuid4())


class Tutorial(Base):
    __tablename__ = "tutorials"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    title: Mapped[str] = mapped_column(String, default="Untitled Tutorial")
    description: Mapped[str] = mapped_column(Text, default="")
    video_path: Mapped[str | None] = mapped_column(String, nullable=True)
    youtube_url: Mapped[str | None] = mapped_column(String, nullable=True)
    duration: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String, default="queued")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    current_stage: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    steps: Mapped[list["TutorialStep"]] = relationship(
        "TutorialStep", back_populates="tutorial", order_by="TutorialStep.step_number", cascade="all, delete-orphan"
    )


class TutorialStep(Base):
    __tablename__ = "tutorial_steps"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    tutorial_id: Mapped[str] = mapped_column(String, ForeignKey("tutorials.id"), nullable=False)
    step_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    timestamp_start: Mapped[float] = mapped_column(Float)
    timestamp_end: Mapped[float] = mapped_column(Float)
    keyframe_path: Mapped[str | None] = mapped_column(String, nullable=True)
    tips: Mapped[list] = mapped_column(JSON, default=list)
    warnings: Mapped[list] = mapped_column(JSON, default=list)
    tools_detected: Mapped[list] = mapped_column(JSON, default=list)
    difficulty: Mapped[str | None] = mapped_column(String, nullable=True)
    tutorial: Mapped["Tutorial"] = relationship("Tutorial", back_populates="steps")
