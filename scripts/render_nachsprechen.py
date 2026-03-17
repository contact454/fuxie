#!/usr/bin/env python3
"""
Fuxie Nachsprechen — Direct TTS Render (bypasses pipeline validator)
====================================================================
Calls Qwen3-TTS /synthesize_clone API directly for each sentence.
Converts WAV → MP3, outputs to Fuxie public/audio/speaking/a1/.

Usage:
  source ../8-Audio-Factory/.venv-qwen/bin/activate
  python3 scripts/render_nachsprechen.py

Requires: Qwen3-TTS server running on port 8004 (clone mode)
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

TTS_URL = "http://127.0.0.1:8004/synthesize_clone"
ARCHETYPE = "mid_female_neutral"  # Clear, measured mid-register — ideal for pronunciation model

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = PROJECT_ROOT.parent / "8-Audio-Factory" / "data" / "scripts" / "Sprechen-Nachsprechen"
OUTPUT_DIR = PROJECT_ROOT / "apps" / "web" / "public" / "audio" / "speaking" / "a1"

# Ensure ffmpeg is available for WAV→MP3
def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, timeout=5)
        return True
    except Exception:
        return False

def wav_to_mp3(wav_path: Path, mp3_path: Path) -> bool:
    """Convert WAV to MP3 using ffmpeg."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-qscale:a", "2", str(mp3_path)],
            capture_output=True, timeout=30,
        )
        return result.returncode == 0
    except Exception as err:
        print(f"    ❌ ffmpeg error: {err}")
        return False

def synthesize_sentence(text: str, output_mp3: Path) -> bool:
    """Call TTS API and save as MP3."""
    payload = {
        "text": text,
        "archetype_id": ARCHETYPE,
        "language": "German",
        "do_sample": True,
        "temperature": 0.3,  # Low temp for consistent, clear pronunciation
        "top_p": 0.9,
        "repetition_penalty": 1.05,
    }

    try:
        resp = requests.post(TTS_URL, json=payload, timeout=60)
        if resp.status_code != 200:
            print(f"    ❌ API error {resp.status_code}: {resp.text[:200]}")
            return False

        # Save WAV first
        wav_path = output_mp3.with_suffix(".wav")
        wav_path.write_bytes(resp.content)

        # Convert to MP3
        if wav_to_mp3(wav_path, output_mp3):
            wav_path.unlink()  # Clean WAV
            return True
        else:
            print(f"    ❌ MP3 conversion failed")
            return False

    except requests.exceptions.Timeout:
        print(f"    ❌ Timeout")
        return False
    except Exception as err:
        print(f"    ❌ Error: {err}")
        return False

def main():
    print("🎙️  Nachsprechen Audio Render — Direct TTS")
    print("=" * 60)

    if not check_ffmpeg():
        print("❌ ffmpeg not found. Install: brew install ffmpeg")
        sys.exit(1)

    # Check TTS server
    try:
        health = requests.get("http://127.0.0.1:8004/health", timeout=5).json()
        if not health.get("ready"):
            print("❌ TTS server not ready")
            sys.exit(1)
        print(f"✅ TTS Server: {health.get('mode')} mode, device={health.get('device')}")
        if ARCHETYPE not in health.get("speaker_prompts", []):
            print(f"⚠️  Archetype '{ARCHETYPE}' not in available speakers: {health.get('speaker_prompts')}")
            sys.exit(1)
        print(f"✅ Archetype: {ARCHETYPE}")
    except Exception as err:
        print(f"❌ Cannot connect to TTS server: {err}")
        sys.exit(1)

    # Discover scripts
    scripts = sorted(SCRIPTS_DIR.glob("L-SPR-*.json"))
    print(f"📋 Found {len(scripts)} scripts")

    rendered = 0
    skipped = 0
    errors = 0
    total_start = time.time()

    for i, script_path in enumerate(scripts, 1):
        data = json.loads(script_path.read_text())
        text = data["lines"][0]["text"]
        topic = data.get("topic", "unknown")
        sentence_id = data.get("output_filename", "").split("/")[-1].replace(".mp3", "")

        # Output path
        topic_dir = OUTPUT_DIR / topic
        topic_dir.mkdir(parents=True, exist_ok=True)
        mp3_path = topic_dir / f"{sentence_id}.mp3"

        # Skip if exists
        if mp3_path.exists() and mp3_path.stat().st_size > 1000:
            print(f"  [{i:>2}/{len(scripts)}] [SKIP] {script_path.stem}")
            skipped += 1
            continue

        print(f"  [{i:>2}/{len(scripts)}] {script_path.stem} → \"{text[:40]}...\"", end="", flush=True)
        start = time.time()

        if synthesize_sentence(text, mp3_path):
            elapsed = time.time() - start
            size_kb = mp3_path.stat().st_size / 1024
            print(f" ✅ ({elapsed:.1f}s, {size_kb:.0f}KB)")
            rendered += 1
        else:
            errors += 1
            print()

        # Small delay to avoid overwhelming GPU
        time.sleep(0.5)

    total_time = time.time() - total_start

    print()
    print("=" * 60)
    print(f"🎉 RENDER COMPLETE")
    print(f"   Rendered: {rendered}")
    print(f"   Skipped:  {skipped}")
    print(f"   Errors:   {errors}")
    print(f"   Total:    {total_time:.1f}s ({total_time/60:.1f} min)")
    print(f"   Output:   {OUTPUT_DIR}")
    print("=" * 60)

    if errors > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
