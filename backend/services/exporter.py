import json
from pathlib import Path
from models import Tutorial, TutorialStep


def export_json(tutorial: Tutorial) -> bytes:
    data = {
        "id": tutorial.id,
        "title": tutorial.title,
        "description": tutorial.description,
        "duration": tutorial.duration,
        "steps": [
            {
                "step_number": s.step_number,
                "title": s.title,
                "description": s.description,
                "timestamp_start": s.timestamp_start,
                "timestamp_end": s.timestamp_end,
                "tips": s.tips,
                "warnings": s.warnings,
                "tools_detected": s.tools_detected,
                "difficulty": s.difficulty,
            }
            for s in tutorial.steps
        ],
    }
    return json.dumps(data, indent=2).encode()


def export_markdown(tutorial: Tutorial) -> bytes:
    lines = [
        f"# {tutorial.title}",
        "",
        tutorial.description,
        "",
        f"**Duration:** {_fmt_time(tutorial.duration)}",
        f"**Steps:** {len(tutorial.steps)}",
        "",
        "---",
        "",
    ]

    for step in tutorial.steps:
        lines += [
            f"## Step {step.step_number}: {step.title}",
            "",
            f"**Timestamp:** {_fmt_time(step.timestamp_start)} → {_fmt_time(step.timestamp_end)}",
            "",
            step.description,
            "",
        ]
        if step.tips:
            lines.append("**Tips:**")
            for tip in step.tips:
                lines.append(f"- {tip}")
            lines.append("")
        if step.warnings:
            lines.append("**Warnings:**")
            for w in step.warnings:
                lines.append(f"- ⚠️ {w}")
            lines.append("")
        if step.tools_detected:
            lines.append(f"**Tools/Materials:** {', '.join(step.tools_detected)}")
            lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines).encode()


def export_pdf(tutorial: Tutorial) -> bytes:
    try:
        from fpdf import FPDF

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()

        # Title
        pdf.set_font("Helvetica", "B", 24)
        pdf.set_text_color(30, 30, 30)
        pdf.multi_cell(0, 12, tutorial.title)
        pdf.ln(4)

        # Description
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(80, 80, 80)
        pdf.multi_cell(0, 6, tutorial.description)
        pdf.ln(6)

        # Meta
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(120, 120, 120)
        pdf.cell(0, 5, f"Duration: {_fmt_time(tutorial.duration)}  |  {len(tutorial.steps)} steps")
        pdf.ln(10)

        # Steps
        for step in tutorial.steps:
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(50, 80, 200)
            pdf.multi_cell(0, 8, f"Step {step.step_number}: {step.title}")

            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(120, 120, 120)
            pdf.cell(0, 5, f"{_fmt_time(step.timestamp_start)} → {_fmt_time(step.timestamp_end)}")
            pdf.ln(6)

            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(40, 40, 40)
            pdf.multi_cell(0, 6, step.description)
            pdf.ln(4)

            if step.tips:
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(160, 120, 0)
                for tip in step.tips:
                    pdf.multi_cell(0, 5, f"Tip: {tip}")

            if step.warnings:
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(180, 50, 50)
                for w in step.warnings:
                    pdf.multi_cell(0, 5, f"Warning: {w}")

            pdf.ln(6)

        return bytes(pdf.output())
    except Exception as e:
        return export_markdown(tutorial)


def _fmt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"
