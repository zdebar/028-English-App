from pathlib import Path
from typing import Any

import pandas as pd

# Deletes rows from target CSV files if their "english" value matches any "english" value from source CSV files.

def normalize_english(value: Any) -> str:
	if pd.isna(value):
		return ""
	return str(value).strip().casefold()


def collect_english_words_from_folder(folder: Path) -> set[str]:
	if not folder.exists():
		raise FileNotFoundError(f"Source folder does not exist: {folder}")

	first_words: set[str] = set()
	for csv_path in sorted(folder.glob("*.csv")):
		df = pd.read_csv(csv_path)
		if "english" not in df.columns:
			raise ValueError(f"Missing column 'english' in source file: {csv_path}")
		first_words.update(df["english"].map(normalize_english))

	first_words.discard("")
	return first_words


def filter_target_file(target_csv: Path, first_words: set[str]) -> None:
	if not target_csv.exists():
		print(f"Skipping missing target file: {target_csv}")
		return

	second_df = pd.read_csv(target_csv)
	if "english" not in second_df.columns:
		raise ValueError(f"Missing column 'english' in target file: {target_csv}")

	second_norm = second_df["english"].map(normalize_english)
	keep_mask = ~second_norm.isin(first_words)
	filtered_df = second_df[keep_mask].copy()
	filtered_df.to_csv(target_csv, index=False)

	removed_count = len(second_df) - len(filtered_df)
	print(f"Done: {target_csv.name}")
	print(f"  Removed rows: {removed_count}")
	print(f"  Original rows: {len(second_df)}")
	print(f"  Remaining rows: {len(filtered_df)}")


def main() -> None:
	script_dir = Path(__file__).resolve().parent
	source_folder = script_dir / "data" / "prepare"
	target_folder = script_dir / "data" / "tracker"
	target_files = [
		target_folder / "200_words.csv",
		target_folder / "1k_words.csv",
		target_folder / "10k_words.csv",
	]

	first_words = collect_english_words_from_folder(source_folder)
	print(f"Collected {len(first_words)} unique english words from: {source_folder}")

	for target_csv in target_files:
		filter_target_file(target_csv, first_words)


if __name__ == "__main__":
	main()
