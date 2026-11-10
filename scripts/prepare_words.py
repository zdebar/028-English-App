import argparse
import os
import re
import sys
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scripts.utils.preparation import fill_is_vocabulary, read_vocab_csv, redo_sort_order
from scripts.utils.pronunciation import fill_pronunciation_espeak_ng
from scripts.utils.audio import (
    DEFAULT_GOOGLE_TTS_VOICE_NAME,
    generate_audio_with_google_cloud,
)
import pandas as pd

INCLUDE_AUDIO_TIMESTAMP = False
CHIRP_HD_F_VOICE_NAME = "en-US-Chirp-HD-F"
CHIRP_HD_F_AUDIO_SUFFIX = "_chirp_hd_f"

def get_lesson_id(file_name: str) -> int:
    match = re.match(r"^(\d+)", os.path.basename(file_name))
    if not match:
        raise ValueError(f"File name must start with a lesson number: {file_name}")
    return int(match.group(1))

async def prepare_words(
    file_name: str,
    output_file: str,
    audio_folder: str,
    suffix: str = "",
    voice_name: str | None = None,
) -> None:
    # 1. Read data
    df = read_vocab_csv(file_name, columns=[
        "id", "czech", "czech_description", "english", "pronunciation", "audio", "sort_order",
        "note_id", "is_vocabulary"
    ])
    if df is None:
        print("Error: DataFrame is None after reading CSV.")
        return
    df = fill_is_vocabulary(df)
    df["lesson_id"] = get_lesson_id(file_name)
    # 2. Fill IPA pronunciation
    df = await fill_pronunciation_espeak_ng(df)
    # 3. Redo sort order
    df = redo_sort_order(df, file_name)
    # # 4. Generate audio files
    df = await generate_audio_with_google_cloud(
        df,
        audio_folder,
        suffix,
        voice_name=voice_name,
    )
    # 5. Force integer columns before saving
    for col in ["id", "sort_order", "note_id", "lesson_id"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df[col] = df[col].apply(lambda x: int(x) if pd.notna(x) and x == int(x) else "")
    df.to_csv(output_file, index=False)
    print(f"Processed and saved: {output_file}")


async def prepare_words_with_existing_voice(
    file_name: str,
    output_file: str,
    audio_folder: str,
    suffix: str = "",
) -> None:
    voice_name = os.getenv("GCP_TTS_VOICE_NAME", DEFAULT_GOOGLE_TTS_VOICE_NAME)
    await prepare_words(
        file_name,
        output_file,
        audio_folder,
        suffix,
        voice_name=voice_name,
    )


async def prepare_words_with_chirp_hd_f(
    file_name: str,
    output_file: str,
    audio_folder: str,
    suffix: str = "",
) -> None:
    chirp_suffix = f"{suffix}{CHIRP_HD_F_AUDIO_SUFFIX}"
    await prepare_words(
        file_name,
        output_file,
        audio_folder,
        chirp_suffix,
        voice_name=CHIRP_HD_F_VOICE_NAME,
    )


async def prepare_words_in_folder(
    data_dir: str,
    audio_folder: str,
    include_audio_timestamp: bool = INCLUDE_AUDIO_TIMESTAMP,
    prepare_word: Callable[[str, str, str, str], Awaitable[None]] = (
        prepare_words_with_existing_voice
    ),
) -> None:
    # Keep output CSVs unique while allowing stable audio names by default.
    output_suffix = datetime.now(timezone.utc).strftime("_%Y%m%dT%H%M%SZ")
    audio_suffix = output_suffix if include_audio_timestamp else ""
    input_files = []

    for entry in sorted(os.listdir(data_dir)):
        file_path = os.path.join(data_dir, entry)
        if not os.path.isfile(file_path):
            continue
        if not entry.lower().endswith(".csv"):
            continue
        # Do not process outputs from this or an earlier preparation run again.
        if re.search(r"_\d{8}(?:T\d{6}Z)?$", os.path.splitext(entry)[0]):
            continue
        input_files.append(file_path)

    if not input_files:
        print(f"No input CSV files found in: {data_dir}")
        return

    for file_path in input_files:
        base_name, extension = os.path.splitext(os.path.basename(file_path))
        output_file = os.path.join(data_dir, f"{base_name}{output_suffix}{extension}")
        await prepare_word(file_path, output_file, audio_folder, audio_suffix)


# Runner
if __name__ == "__main__":
    import asyncio
    data_dir = os.path.join(os.path.dirname(__file__), "data/prepare")
    audio_folder = os.path.join(data_dir, "audio")

    parser = argparse.ArgumentParser(description="Prepare vocabulary and its audio.")
    parser.add_argument(
        "--voice-model",
        choices=("current", "chirp3-hd-f"),
        default="current",
        help="Google TTS voice model to use for generated audio.",
    )
    args = parser.parse_args()

    # Ensure output and audio/opus folders exist
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(audio_folder, exist_ok=True)

    word_preparer = prepare_words_with_existing_voice
    if args.voice_model == "chirp3-hd-f":
        word_preparer = prepare_words_with_chirp_hd_f

    asyncio.run(
        prepare_words_in_folder(data_dir, audio_folder, prepare_word=word_preparer)
    )

# Guide
