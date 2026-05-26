from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional


class TutorialStepOut(BaseModel):
    id: str
    step_number: int
    title: str
    description: str
    timestamp_start: float
    timestamp_end: float
    keyframe_url: Optional[str]
    tips: list[str]
    warnings: list[str]
    tools_detected: list[str]
    difficulty: Optional[str]

    model_config = {"from_attributes": True}


class TutorialOut(BaseModel):
    id: str
    title: str
    description: str
    video_url: Optional[str]
    youtube_url: Optional[str]
    duration: float
    status: str
    progress: int
    current_stage: Optional[str]
    error_message: Optional[str]
    steps: list[TutorialStepOut]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    tutorial_id: str
    status: str
    message: str


class YouTubeRequest(BaseModel):
    url: str


class ProgressEvent(BaseModel):
    status: str
    progress: int
    current_stage: Optional[str]
    error_message: Optional[str]
