#!/usr/bin/env python3
"""
Check audio files referenced in local CSV files against files in ./audio.
"""

from __future__ import annotations

import csv
from pathlib import Path


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    audio_dir = script_dir / "audio"

    if not audio_dir.is_dir():
        print(f"ERROR: audio subfolder not found at {audio_dir}")
        return 1

    csv_files = sorted(script_dir.glob("*.csv"))
    if not csv_files:
        print(f"No CSV files found in {script_dir}")
        return 0

    used_audio: set[str] = set()
    present_audio: set[str] = set()

    # Read each CSV and extract values from its "audio" column.
    for csv_file in csv_files:
        with csv_file.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                continue

            # Find "audio" column case-insensitively.
            audio_key = next((h for h in reader.fieldnames if h and h.strip().lower() == "audio"), None)
            if audio_key is None:
                continue

            for row in reader:
                value = (row.get(audio_key) or "").strip()
                if value:
                    used_audio.add(value)

    # Files present in ./audio (only files, not folders).
    for p in audio_dir.iterdir():
        if p.is_file():
            present_audio.add(p.name)

    missing = sorted(used_audio - present_audio)
    unused = sorted(present_audio - used_audio)

    print("=== Missing audio files (referenced in CSV, not found in ./audio) ===")
    if missing:
        for name in missing:
            print(name)
    else:
        print("None")

    print()
    print("=== Unused audio files (present in ./audio, not referenced in CSV) ===")
    if unused:
        for name in unused:
            print(name)
    else:
        print("None")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())