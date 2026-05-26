import json
from anthropic import AsyncAnthropic
from config import ANTHROPIC_API_KEY


async def generate_instructions(
    transcript_segments: list[dict],
    scenes: list[dict],
    duration: float,
    video_title: str = "Tutorial",
) -> dict:
    """
    Use Claude to analyze transcript + scenes and generate structured tutorial steps.
    Returns: {title, description, steps: [{...}]}
    """
    if not ANTHROPIC_API_KEY:
        return _mock_instructions(scenes, duration)

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

    transcript_text = " ".join(s["text"] for s in transcript_segments)

    scenes_summary = []
    for i, scene in enumerate(scenes[:30]):  # Limit to 30 scenes
        scenes_summary.append(f"Scene {i+1}: {scene['start_time']:.1f}s - {scene['end_time']:.1f}s")

    prompt = f"""You are an expert instructional designer. Analyze this video content and create a structured step-by-step tutorial.

Video duration: {duration:.0f} seconds
Detected scenes: {chr(10).join(scenes_summary)}

Transcript:
{transcript_text[:8000]}

Create a tutorial with 5-15 steps. Each step should represent a meaningful action or concept.

Respond with ONLY valid JSON in this exact format:
{{
  "title": "Tutorial title (concise, descriptive)",
  "description": "Brief overview of what this tutorial covers",
  "steps": [
    {{
      "step_number": 1,
      "title": "Step title (action-oriented)",
      "description": "Clear explanation of what to do and why (2-4 sentences)",
      "timestamp_start": 0.0,
      "timestamp_end": 15.0,
      "tips": ["Helpful tip if applicable"],
      "warnings": ["Warning if there's a gotcha"],
      "tools_detected": ["tool or material mentioned"],
      "difficulty": "beginner"
    }}
  ]
}}

difficulty must be one of: beginner, intermediate, advanced, or null.
tips, warnings, tools_detected can be empty arrays.
Timestamps must be within video duration ({duration:.0f}s).
"""

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text.strip()
    # Extract JSON if wrapped in code blocks
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    return json.loads(text)


def _mock_instructions(scenes: list[dict], duration: float) -> dict:
    """Fallback mock data when no API keys are configured."""
    step_count = max(3, min(8, len(scenes)))
    step_duration = duration / step_count

    steps = []
    for i in range(step_count):
        start = i * step_duration
        end = min((i + 1) * step_duration, duration)
        steps.append({
            "step_number": i + 1,
            "title": f"Step {i + 1}: Action {i + 1}",
            "description": f"This step covers the actions performed between {start:.0f}s and {end:.0f}s in the video. Follow along carefully to complete this part of the tutorial.",
            "timestamp_start": start,
            "timestamp_end": end,
            "tips": ["Take your time with this step"] if i == 0 else [],
            "warnings": [],
            "tools_detected": [],
            "difficulty": "beginner" if i < 2 else "intermediate",
        })

    return {
        "title": "Video Tutorial",
        "description": "A step-by-step guide generated from the uploaded video.",
        "steps": steps,
    }
