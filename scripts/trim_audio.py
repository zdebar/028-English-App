"""Trim silence from generated audio files in the preparation folder."""

import sys
from pathlib import Path

ROOT_FOLDER = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_FOLDER))

from scripts.utils.audio import trim_audio

PREPARE_FOLDER = Path(__file__).parent / "data" / "prepare"
AUDIO_FOLDER = PREPARE_FOLDER / "audio"
TRIMMED_AUDIO_FOLDER = PREPARE_FOLDER / "audio_trim"
AUDIO_EXTENSIONS = {".opus", ".ogg"}

# Trim configuration. Values are intentionally conservative defaults.
# Keep the beginning by default: weak initial consonants can resemble silence.
TRIM_START = True
TRIM_END = True
SILENCE_THRESHOLD_DB = -100
MIN_SILENCE_MS = 250
KEEP_SILENCE_MS = 250


def trim_audio_folder() -> None:
    if not AUDIO_FOLDER.exists():
        print(f"Audio folder does not exist: {AUDIO_FOLDER}")
        return

    files = sorted(
        path for path in AUDIO_FOLDER.iterdir() if path.is_file() and path.suffix.lower() in AUDIO_EXTENSIONS
    )
    if not files:
        print(f"No audio files found in: {AUDIO_FOLDER}")
        return

    TRIMMED_AUDIO_FOLDER.mkdir(parents=True, exist_ok=True)

    for path in files:
        try:
            original = path.read_bytes()
            trimmed = trim_audio(
                original,
                trim_start=TRIM_START,
                trim_end=TRIM_END,
                silence_threshold_db=SILENCE_THRESHOLD_DB,
                min_silence_ms=MIN_SILENCE_MS,
                keep_silence_ms=KEEP_SILENCE_MS,
            )
            output_path = TRIMMED_AUDIO_FOLDER / path.name
            output_path.write_bytes(trimmed)
            print(f"Trimmed: {path.name} -> {output_path}")
        except OSError as error:
            print(f"Error trimming {path}: {error}")


if __name__ == "__main__":
    trim_audio_folder()
