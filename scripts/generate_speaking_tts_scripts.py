#!/usr/bin/env python3
"""
generate_speaking_tts_scripts.py

Reads Fuxie content JSON files (content/{level}/speaking/*.json) and generates
per-sentence Audio-Factory scripts for TTS rendering via Qwen3.

Input:  content/{a1,a2,b1,b2,c1,c2}/speaking/{topic-slug}.json
Output: 8-Audio-Factory/data/scripts/Sprechen-Nachsprechen-Phase2/{topic}/L-SPR-{LEVEL}-{TOPIC}-{LL}-S{S}.json

Usage:
    python3 scripts/generate_speaking_tts_scripts.py           # All levels
    python3 scripts/generate_speaking_tts_scripts.py --level b2  # B2 only
    python3 scripts/generate_speaking_tts_scripts.py --dry-run   # Preview only
"""

import argparse
import json
import sys
from pathlib import Path

# Paths
FUXIE_ROOT = Path(__file__).resolve().parent.parent
CONTENT_ROOT = FUXIE_ROOT / "content"
AUDIO_FACTORY = FUXIE_ROOT.parent / "8-Audio-Factory"
SCRIPTS_DIR = AUDIO_FACTORY / "data" / "scripts" / "Sprechen-Nachsprechen-Phase2"

LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"]

# Voice config per CEFR band
VOICE_CONFIG = {
    "a1": {"speed": 0.65, "instruct": "[Speak slowly and clearly as a pronunciation model for German language learners. Articulate each word precisely with natural intonation. Maintain consistent warm, encouraging tone.]"},
    "a2": {"speed": 0.65, "instruct": "[Speak slowly and clearly as a pronunciation model for German language learners. Articulate each word precisely with natural intonation. Maintain consistent warm, encouraging tone.]"},
    "b1": {"speed": 0.70, "instruct": "[Speak clearly as a pronunciation model for intermediate German learners. Natural pace with precise articulation. Warm, supportive tone.]"},
    "b2": {"speed": 0.75, "instruct": "[Speak at a natural pace as a pronunciation model for upper-intermediate German learners. Clear Hochdeutsch pronunciation with natural intonation and rhythm.]"},
    "c1": {"speed": 0.80, "instruct": "[Speak at natural conversational pace as a pronunciation model for advanced German learners. Clear Hochdeutsch with natural prosody, stress patterns, and sentence melody.]"},
    "c2": {"speed": 0.85, "instruct": "[Speak at natural native pace as a pronunciation model for near-native German learners. Natural Hochdeutsch with sophisticated intonation, appropriate emphasis, and authentic rhythm.]"},
}

VOICE_DESCRIPTION = (
    "A 30-year-old clear German female with a warm, neutral mid-register voice. "
    "Precise Hochdeutsch pronunciation with ideal articulation speed for language learners. "
    "Clear enunciation of each syllable, natural rhythm, no regional accent. "
    "Studio-quality microphone, close distance."
)


def slug_to_topic_upper(slug: str) -> str:
    """Convert 'b2-freizeit' → 'FREIZEIT', 'a1-essen-trinken' → 'ESSEN-TRINKEN'."""
    parts = slug.split("-")[1:]  # Remove level prefix
    return "-".join(p.upper() for p in parts)


def generate_scripts(level: str, dry_run: bool = False) -> dict:
    """Generate Audio-Factory scripts for all topics at a given level."""
    content_dir = CONTENT_ROOT / level / "speaking"
    if not content_dir.exists():
        print(f"  ⏭️  {level.upper()}: No content directory")
        return {"topics": 0, "lessons": 0, "sentences": 0, "scripts": 0}

    content_files = sorted(content_dir.glob("*.json"))
    if not content_files:
        print(f"  ⏭️  {level.upper()}: No JSON files")
        return {"topics": 0, "lessons": 0, "sentences": 0, "scripts": 0}

    level_upper = level.upper()
    voice_cfg = VOICE_CONFIG.get(level, VOICE_CONFIG["b1"])

    stats = {"topics": 0, "lessons": 0, "sentences": 0, "scripts": 0}

    for content_file in content_files:
        data = json.loads(content_file.read_text(encoding="utf-8"))
        topic_slug = data["topicSlug"]
        topic_upper = slug_to_topic_upper(topic_slug)

        output_dir = SCRIPTS_DIR / topic_slug
        if not dry_run:
            output_dir.mkdir(parents=True, exist_ok=True)

        stats["topics"] += 1
        topic_scripts = 0

        for lesson in data.get("lessons", []):
            lesson_num = lesson["lessonNumber"]
            lesson_str = str(lesson_num).zfill(2)
            stats["lessons"] += 1

            sentences = lesson.get("sentences", [])
            for s_idx, sentence in enumerate(sentences, 1):
                # Get German text (handle both formats)
                text = sentence.get("textDe") or sentence.get("german", "")
                if not text:
                    continue

                script_id = f"L-SPR-{level_upper}-{topic_upper}-{lesson_str}-S{s_idx}"
                output_filename = f"Sprechen-Nachsprechen-Phase2/{topic_slug}/s{lesson_str}_{s_idx}.mp3"

                script = {
                    "lesson_id": script_id,
                    "level": level_upper,
                    "title": f"Nachsprechen ({lesson_str}-{s_idx}): {text[:50]}{'...' if len(text) > 50 else ''}",
                    "board": "FUXIE",
                    "teil": 0,
                    "teil_name": "Nachsprechen",
                    "task_type": "repeat_after_me",
                    "topic": topic_slug,
                    "background_scene": "none",
                    "background_sfx_volume": 0,
                    "output_filename": output_filename,
                    "lines": [
                        {
                            "speaker": "Modell_Sprecher",
                            "speaker_role": "pronunciation_model",
                            "voice_description": VOICE_DESCRIPTION,
                            "instruct_control": voice_cfg["instruct"],
                            "emotion": "neutral",
                            "speed": voice_cfg["speed"],
                            "pause_after": 0.5,
                            "engine": "qwen3",
                            "text": text,
                        }
                    ],
                }

                if not dry_run:
                    script_path = output_dir / f"{script_id}.json"
                    script_path.write_text(
                        json.dumps(script, ensure_ascii=False, indent=2),
                        encoding="utf-8",
                    )

                stats["sentences"] += 1
                stats["scripts"] += 1
                topic_scripts += 1

        print(f"  🎤 {topic_slug}: {len(data.get('lessons', []))} lessons, {topic_scripts} scripts")

    return stats


def main():
    parser = argparse.ArgumentParser(
        description="Generate Audio-Factory TTS scripts from Fuxie speaking content"
    )
    parser.add_argument("--level", type=str, help="Only process specific level (a1, a2, ...)")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, don't write files")
    args = parser.parse_args()

    print("🎤 Fuxie Speaking → Audio-Factory Script Generator")
    print("=" * 55)
    print(f"  Content root : {CONTENT_ROOT}")
    print(f"  Output dir   : {SCRIPTS_DIR}")
    print(f"  Dry run      : {args.dry_run}")
    print()

    levels = [args.level.lower()] if args.level else LEVELS
    grand = {"topics": 0, "lessons": 0, "sentences": 0, "scripts": 0}

    for level in levels:
        if level not in LEVELS:
            print(f"  ❌ Unknown level: {level}")
            continue

        print(f"\n📂 {level.upper()}:")
        stats = generate_scripts(level, dry_run=args.dry_run)
        for k in grand:
            grand[k] += stats[k]

    print(f"\n{'=' * 55}")
    print(f"📊 Grand total:")
    print(f"   Topics:    {grand['topics']}")
    print(f"   Lessons:   {grand['lessons']}")
    print(f"   Sentences: {grand['sentences']}")
    print(f"   Scripts:   {grand['scripts']}")
    if args.dry_run:
        print("\n  ⚠️  DRY RUN — no files written")
    print("\n✅ Script generation complete! 🦊")


if __name__ == "__main__":
    main()
