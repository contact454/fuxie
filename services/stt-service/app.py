"""
Fuxie STT Service — Faster-Whisper Microservice
Receives audio files, returns German transcription.
Supports GPU (CUDA), Apple Silicon (MPS→CPU), and CPU.

Usage: python app.py
Requires: pip install faster-whisper flask gunicorn
"""

from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import tempfile
import os
import sys
import time
import platform

app = Flask(__name__)

# ============================================================
# Auto-detect device and optimal settings
# ============================================================
def detect_device():
    """Auto-detect best device: CUDA > CPU (faster-whisper uses CTranslate2, not MPS)."""
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda", "int8"
    except ImportError:
        pass

    # faster-whisper/CTranslate2 does NOT support MPS
    # On Apple Silicon, CPU with int8 is fastest
    return "cpu", "int8"


DEVICE, COMPUTE_TYPE = detect_device()

# Model selection: use distil-large-v3 for faster inference on CPU
# or large-v3-turbo for maximum accuracy on GPU
MODEL_NAME = os.environ.get("STT_MODEL", "large-v3-turbo" if DEVICE == "cuda" else "distil-large-v3")

print(f"🔄 Loading Whisper model: {MODEL_NAME}")
print(f"   Device: {DEVICE}, Compute: {COMPUTE_TYPE}, OS: {platform.system()} {platform.machine()}")

model = WhisperModel(
    MODEL_NAME,
    device=DEVICE,
    compute_type=COMPUTE_TYPE,
    cpu_threads=min(os.cpu_count() or 4, 8),  # Use up to 8 CPU threads
)
print(f"✅ Model loaded! ({MODEL_NAME} on {DEVICE})")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE,
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():
    start = time.time()

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    language = request.form.get("language", "de")

    # Save to temp file
    content_type = audio_file.content_type or ""
    if "webm" in content_type:
        suffix = ".webm"
    elif "mp4" in content_type or "m4a" in content_type:
        suffix = ".m4a"
    elif "ogg" in content_type:
        suffix = ".ogg"
    else:
        suffix = ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=language,
            beam_size=5,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=True,  # Enable word-level timestamps for better evaluation
        )

        # Collect segments
        result_segments = []
        full_text_parts = []
        word_list = []

        for seg in segments:
            seg_text = seg.text.strip()
            result_segments.append({
                "text": seg_text,
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
            })
            full_text_parts.append(seg_text)

            # Collect word-level timestamps
            if seg.words:
                for w in seg.words:
                    word_list.append({
                        "word": w.word.strip(),
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                        "probability": round(w.probability, 3),
                    })

        elapsed = round(time.time() - start, 2)

        return jsonify({
            "text": " ".join(full_text_parts),
            "segments": result_segments,
            "words": word_list,
            "language": info.language,
            "language_probability": round(info.language_probability, 2),
            "duration": round(info.duration, 2),
            "processing_time": elapsed,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    port = int(os.environ.get("STT_PORT", 5050))
    print(f"🎤 STT Service running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
