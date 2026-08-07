import sys
import os
import re
from datetime import datetime, timezone

import pandas as pd

INCLUDE_AUDIO_TIMESTAMP = False

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scripts.utils.preparation import read_vocab_csv, redo_sort_order
from scripts.utils.pronunciation import fill_pronunciation_espeak_ng
from scripts.utils.audio import generate_audio_with_google_cloud_from_ipa


def get_lesson_id(file_name: str) -> int:
    match = re.match(r"^(\d+)", os.path.basename(file_name))
    if not match:
        raise ValueError(f"File name must start with a lesson number: {file_name}")
    return int(match.group(1))


async def prepare_audio(file_name: str, output_file: str, audio_folder: str, suffix: str = "") -> None:
    # 1. Read data
    df = read_vocab_csv(file_name, columns=[
        "id", "czech", "english", "pronunciation", "audio", "sort_order",
        "block_id", "note_id", "grammar_chunk_id"
    ])
    if df is None:
        print("Error: DataFrame is None after reading CSV.")
        return
    df["is_vocabulary"] = df["grammar_chunk_id"].isna() | df["grammar_chunk_id"].astype(str).str.strip().eq("")
    df["lesson_id"] = get_lesson_id(file_name)

    # 2. Ensure IPA pronunciation exists
    needs_pronunciation = "pronunciation" not in df.columns or df["pronunciation"].astype(str).str.strip().eq("").any()
    if needs_pronunciation:
        df = await fill_pronunciation_espeak_ng(df)

    # 3. Redo sort order 
    df = redo_sort_order(df, file_name)

    # 4. Generate audio files from IPA (not from English text)
    df = await generate_audio_with_google_cloud_from_ipa(df, audio_folder, suffix)

    # 5. Force integer columns before saving
    for col in ["id", "sort_order", "block_id", "note_id", "grammar_chunk_id", "lesson_id"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df[col] = df[col].apply(lambda x: int(x) if pd.notna(x) and x == int(x) else "")

    df.to_csv(output_file, index=False)
    print(f"Processed and saved: {output_file}")


async def prepare_audio_in_folder(
    data_dir: str,
    audio_folder: str,
    include_audio_timestamp: bool = INCLUDE_AUDIO_TIMESTAMP,
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
        await prepare_audio(file_path, output_file, audio_folder, audio_suffix)


if __name__ == "__main__":
    import asyncio

    data_dir = os.path.join(os.path.dirname(__file__), "data/prepare")
    audio_folder = os.path.join(data_dir, "audio")

    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(audio_folder, exist_ok=True)

    asyncio.run(prepare_audio_in_folder(data_dir, audio_folder))
