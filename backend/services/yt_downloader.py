import asyncio
import uuid
from pathlib import Path
from config import UPLOAD_DIR


async def download_youtube(url: str) -> tuple[Path, str]:
    """
    Download a YouTube video using yt-dlp.
    Returns (video_path, title).
    """
    video_id = str(uuid.uuid4())
    output_path = UPLOAD_DIR / f"{video_id}.mp4"

    loop = asyncio.get_event_loop()
    title = await loop.run_in_executor(None, _download_sync, url, output_path)
    return output_path, title


def _download_sync(url: str, output_path: Path) -> str:
    import yt_dlp

    ydl_opts = {
        "format": "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
        "outtmpl": str(output_path.with_suffix("")),
        "merge_output_format": "mp4",
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return info.get("title", "YouTube Tutorial")
