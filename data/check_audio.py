#!/usr/bin/env python3
"""
Check audio files referenced in local CSV files against files in ./audio.
"""

from __future__ import annotations

import csv
from collections.abc import Sequence
from pathlib import Path


def find_audio_key(fieldnames: Sequence[str]) -> str | None:
    """Find the audio column without relying on its capitalization."""
    return next((header for header in fieldnames if header.strip().lower() == "audio"), None)


def collect_audio_from_csv(csv_file: Path) -> set[str]:
    """Return the non-empty audio references from one CSV file."""
    with csv_file.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        if not reader.fieldnames:
            return set()

        audio_key = find_audio_key(reader.fieldnames)
        if audio_key is None:
            return set()

        used_audio: set[str] = set()
        for row in reader:
            value = (row.get(audio_key) or "").strip()
            if value:
                used_audio.add(value)
        return used_audio


def collect_used_audio(csv_files: list[Path]) -> set[str]:
    """Collect unique audio references from all CSV files."""
    used_audio: set[str] = set()
    for csv_file in csv_files:
        used_audio.update(collect_audio_from_csv(csv_file))
    return used_audio


def collect_present_audio(audio_dir: Path) -> set[str]:
    """Collect names of files present in the audio directory."""
    present_audio: set[str] = set()
    for path in audio_dir.iterdir():
        if path.is_file():
            present_audio.add(path.name)
    return present_audio


def print_audio_section(title: str, filenames: list[str]) -> None:
    """Print one missing/unused audio section."""
    print(title)
    if filenames:
        for name in filenames:
            print(name)
    else:
        print("None")


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

    used_audio = collect_used_audio(csv_files)
    present_audio = collect_present_audio(audio_dir)
    missing = sorted(used_audio - present_audio)
    unused = sorted(present_audio - used_audio)

    print_audio_section(
        "=== Missing audio files (referenced in CSV, not found in ./audio) ===",
        missing,
    )
    print()
    print_audio_section(
        "=== Unused audio files (present in ./audio, not referenced in CSV) ===",
        unused,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
