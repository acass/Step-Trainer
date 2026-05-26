from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db
from config import UPLOAD_DIR, KEYFRAME_DIR
from routers import upload, tutorials, export


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="VisionFlow AI API",
    description="AI-powered video to tutorial converter",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(tutorials.router)
app.include_router(export.router)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/keyframes", StaticFiles(directory=str(KEYFRAME_DIR)), name="keyframes")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "VisionFlow AI"}
