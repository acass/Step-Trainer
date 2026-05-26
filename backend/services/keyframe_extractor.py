import asyncio
from pathlib import Path
from config import KEYFRAME_DIR


async def extract_keyframes(video_path: Path, timestamps: list[float], tutorial_id: str) -> dict[float, str]:
    """
    Extract keyframes at given timestamps.
    Returns dict mapping timestamp -> relative path.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _extract_sync, video_path, timestamps, tutorial_id)


def _extract_sync(video_path: Path, timestamps: list[float], tutorial_id: str) -> dict[float, str]:
    try:
        import cv2

        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        results = {}

        out_dir = KEYFRAME_DIR / tutorial_id
        out_dir.mkdir(parents=True, exist_ok=True)

        for ts in timestamps:
            frame_num = int(ts * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            if ret:
                filename = f"step_{ts:.1f}.jpg"
                out_path = out_dir / filename
                cv2.imwrite(str(out_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                results[ts] = f"keyframes/{tutorial_id}/{filename}"

        cap.release()
        return results
    except Exception as e:
        print(f"Keyframe extraction error: {e}")
        return {}
