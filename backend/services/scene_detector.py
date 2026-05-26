import asyncio
from pathlib import Path


async def detect_scenes(video_path: Path) -> list[dict]:
    """
    Detect scene boundaries using PySceneDetect.
    Returns list of scenes: [{start_time, end_time, start_frame, end_frame}]
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _detect_scenes_sync, video_path)


def _detect_scenes_sync(video_path: Path) -> list[dict]:
    try:
        from scenedetect import open_video, SceneManager
        from scenedetect.detectors import ContentDetector

        video = open_video(str(video_path))
        scene_manager = SceneManager()
        scene_manager.add_detector(ContentDetector(threshold=27.0))
        scene_manager.detect_scenes(video, show_progress=False)
        scene_list = scene_manager.get_scene_list()

        scenes = []
        for start, end in scene_list:
            scenes.append({
                "start_time": start.get_seconds(),
                "end_time": end.get_seconds(),
                "start_frame": start.get_frames(),
                "end_frame": end.get_frames(),
            })
        return scenes
    except Exception as e:
        print(f"Scene detection error: {e}")
        return []
