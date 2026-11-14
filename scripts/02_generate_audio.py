"""Generate audio for timestamped vocabulary CSV files in ``data/prepare``.

By default, audio is synthesized from the ``english`` column. Pass ``--ipa``
to synthesize from the IPA pronunciation in the ``pronunciation`` column
instead; ``english`` is still used as the spoken text inside the IPA phoneme
tag and to build audio filenames. Both modes use ``en-US-Neural2-F``, write
recordings to ``data/prepare/audio``, and update the CSV's ``audio`` column.

Run from the repository root with ``python scripts/02_generate_audio.py`` or
``python scripts/02_generate_audio.py --ipa``.
"""

import argparse
import asyncio
import os
import re
import sys

import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.utils.audio import (
    generate_audio_with_google_cloud,
    generate_audio_with_google_cloud_from_ipa,
)


VOICE_NAME = "en-US-Neural2-F"
VOICE_LANGUAGE = "en-US"
PREPARED_FILE_PATTERN = re.compile(r"_\d{8}(?:T\d{6}Z)?$")


async def generate_audio_for_csv(
    file_path: str,
    audio_folder: str,
    use_ipa: bool = False,
) -> None:
    """Generate audio in the selected mode and save filenames to the CSV."""
    df = pd.read_csv(file_path, skipinitialspace=True)
    required_columns = {"english"}
    if use_ipa:
        required_columns.add("pronunciation")

    missing_columns = required_columns.difference(df.columns)
    if missing_columns:
        print(
            f"Skipping CSV without required columns {sorted(missing_columns)}: "
            f"{file_path}"
        )
        return

    if use_ipa:
        df = await generate_audio_with_google_cloud_from_ipa(
            df,
            audio_folder,
            language_code=VOICE_LANGUAGE,
            overwrite_existing=True,
            voice_name=VOICE_NAME,
        )
    else:
        df = await generate_audio_with_google_cloud(
            df,
            audio_folder,
            language_code=VOICE_LANGUAGE,
            voice_name=VOICE_NAME,
        )

    df.to_csv(file_path, index=False)
    print(f"Audio names added and saved: {file_path}")


async def generate_audio_in_folder(
    data_dir: str,
    audio_folder: str,
    use_ipa: bool = False,
) -> None:
    """Generate audio for timestamped CSVs produced by 01_prepare_data.py."""
    prepared_files = get_prepared_csv_files(data_dir)
    if not prepared_files:
        print(f"No prepared CSV files found in: {data_dir}")
        return

    os.makedirs(audio_folder, exist_ok=True)
    for file_path in prepared_files:
        await generate_audio_for_csv(file_path, audio_folder, use_ipa=use_ipa)


def get_prepared_csv_files(data_dir: str) -> list[str]:
    prepared_files = []
    for entry in sorted(os.listdir(data_dir)):
        file_path = os.path.join(data_dir, entry)
        if not os.path.isfile(file_path) or not entry.lower().endswith(".csv"):
            continue
        file_stem = os.path.splitext(entry)[0]
        if PREPARED_FILE_PATTERN.search(file_stem):
            prepared_files.append(file_path)
    return prepared_files


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate vocabulary audio.")
    parser.add_argument(
        "--ipa",
        action="store_true",
        help="Generate audio from the pronunciation IPA column instead of English text.",
    )
    args = parser.parse_args()

    data_dir = os.path.join(os.path.dirname(__file__), "data", "prepare")
    audio_folder = os.path.join(data_dir, "audio")
    os.makedirs(data_dir, exist_ok=True)
    asyncio.run(
        generate_audio_in_folder(data_dir, audio_folder, use_ipa=args.ipa)
    )


if __name__ == "__main__":
    main()
