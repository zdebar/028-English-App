import asyncio
import os
import re
import sys
from datetime import datetime, timezone

import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.utils.preparation import fill_is_vocabulary, read_vocab_csv, redo_sort_order
from scripts.utils.pronunciation import fill_pronunciation_espeak_ng


INPUT_COLUMNS = [
    "id",
    "czech",
    "czech_description",
    "english",
    "pronunciation",
    "audio",
    "sort_order",
    "note_id",
    "is_vocabulary",
]
TIMESTAMPED_FILE_PATTERN = re.compile(r"_\d{8}(?:T\d{6}Z)?$")
PRONUNCIATION_LANGUAGE = "en-us"


async def prepare_csv(file_path: str, output_file: str) -> None:
    """Normalize a source CSV and add British English IPA pronunciations."""
    df = read_vocab_csv(file_path, columns=INPUT_COLUMNS)
    if df is None:
        print(f"Error: DataFrame is None after reading CSV: {file_path}")
        return

    df = fill_is_vocabulary(df)
    df["lesson_id"] = get_lesson_id(file_path)
    df = await fill_pronunciation_espeak_ng(df, lang=PRONUNCIATION_LANGUAGE)
    df = redo_sort_order(df, file_path)
    normalize_integer_columns(df)
    df.to_csv(output_file, index=False)
    print(f"Prepared data and saved: {output_file}")


async def prepare_data_in_folder(data_dir: str) -> None:
    """Prepare each source CSV, writing a timestamped IPA-ready copy."""
    input_files = get_source_csv_files(data_dir)
    if not input_files:
        print(f"No source CSV files found in: {data_dir}")
        return

    output_suffix = datetime.now(timezone.utc).strftime("_%Y%m%dT%H%M%SZ")
    for file_path in input_files:
        base_name, extension = os.path.splitext(os.path.basename(file_path))
        output_file = os.path.join(data_dir, f"{base_name}{output_suffix}{extension}")
        await prepare_csv(file_path, output_file)


def get_lesson_id(file_name: str) -> int:
    match = re.match(r"^(\d+)", os.path.basename(file_name))
    if not match:
        raise ValueError(f"File name must start with a lesson number: {file_name}")
    return int(match.group(1))


def get_source_csv_files(data_dir: str) -> list[str]:
    input_files = []
    for entry in sorted(os.listdir(data_dir)):
        file_path = os.path.join(data_dir, entry)
        if not os.path.isfile(file_path) or not entry.lower().endswith(".csv"):
            continue
        if TIMESTAMPED_FILE_PATTERN.search(os.path.splitext(entry)[0]):
            continue
        input_files.append(file_path)
    return input_files


def normalize_integer_columns(df: pd.DataFrame) -> None:
    for column in ("id", "sort_order", "note_id", "lesson_id"):
        if column not in df.columns:
            continue
        df[column] = pd.to_numeric(df[column], errors="coerce")
        df[column] = df[column].apply(
            lambda value: int(value)
            if pd.notna(value) and value == int(value)
            else ""
        )


def main() -> None:
    data_dir = os.path.join(os.path.dirname(__file__), "data", "prepare")
    os.makedirs(data_dir, exist_ok=True)
    asyncio.run(prepare_data_in_folder(data_dir))


if __name__ == "__main__":
    main()
