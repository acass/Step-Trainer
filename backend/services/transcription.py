import asyncio
from pathlib import Path
import httpx
from config import OPENAI_API_KEY


async def transcribe_audio(audio_path: Path) -> list[dict]:
    """
    Transcribe audio using OpenAI Whisper API.
    Returns list of segments: [{start, end, text}]
    """
    if not OPENAI_API_KEY:
        # Return mock data if no API key
        return [{"start": 0.0, "end": 5.0, "text": "Welcome to this tutorial."}]

    try:
        import openai
        client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

        with open(audio_path, "rb") as f:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        segments = []
        for seg in (response.segments or []):
            segments.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
            })
        return segments
    except Exception as e:
        print(f"Transcription error: {e}")
        return []
