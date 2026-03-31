from pathlib import Path
from typing import Any

import pandas as pd

# Deletes rows from target CSV files only when both "czech" and "english"
# match a row from the source CSV files.

def normalize_english(value: Any) -> str:
	if pd.isna(value):
		return ""
	return str(value).strip().casefold()


def normalize_text(value: Any) -> str:
	if pd.isna(value):
		return ""
	return str(value).strip().casefold()


def collect_czech_english_keys_from_folder(folder: Path) -> set[tuple[str, str]]:
	if not folder.exists():
		raise FileNotFoundError(f"Source folder does not exist: {folder}")

	keys: set[tuple[str, str]] = set()
	for csv_path in sorted(folder.glob("*.csv")):
		df = pd.read_csv(csv_path)
		if "czech" not in df.columns or "english" not in df.columns:
			raise ValueError(f"Missing column 'czech' or 'english' in source file: {csv_path}")

		for row in df.itertuples(index=False):
			key = (normalize_text(getattr(row, "czech", "")), normalize_text(getattr(row, "english", "")))
			if key != ("", ""):
				keys.add(key)

	return keys


def collect_czech_english_rows_from_folder(folder: Path) -> pd.DataFrame:
	if not folder.exists():
		raise FileNotFoundError(f"Source folder does not exist: {folder}")

	rows: list[pd.DataFrame] = []
	for csv_path in sorted(folder.glob("*.csv")):
		df = pd.read_csv(csv_path)
		if "czech" not in df.columns or "english" not in df.columns:
			raise ValueError(f"Missing column 'czech' or 'english' in source file: {csv_path}")

		subset = df[["czech", "english"]].copy()
		subset["source_file"] = csv_path.name
		rows.append(subset)

	if not rows:
		return pd.DataFrame(columns=["czech", "english", "source_file"])

	return pd.concat(rows, ignore_index=True)


def update_already_used_csv(source_folder: Path, tracker_folder: Path) -> None:
	tracker_folder.mkdir(parents=True, exist_ok=True)
	already_used_csv = tracker_folder / "already_used.csv"

	if not already_used_csv.exists():
		pd.DataFrame(columns=["czech", "english"]).to_csv(already_used_csv, index=False)
		print(f"Created: {already_used_csv}")

	existing_df = pd.read_csv(already_used_csv)
	if "czech" not in existing_df.columns or "english" not in existing_df.columns:
		raise ValueError(f"Missing column 'czech' or 'english' in tracker file: {already_used_csv}")

	source_rows = collect_czech_english_rows_from_folder(source_folder)
	if source_rows.empty:
		print(f"No source rows found in: {source_folder}")
		return

	existing_keys = set(
		zip(
			existing_df["czech"].map(normalize_text),
			existing_df["english"].map(normalize_text),
		)
	)

	conflicts: list[tuple[str, str, str]] = []
	to_append: list[dict[str, str]] = []
	seen_in_batch: set[tuple[str, str]] = set()

	for row in source_rows.itertuples(index=False):
		czech = "" if pd.isna(row.czech) else str(row.czech).strip()
		english = "" if pd.isna(row.english) else str(row.english).strip()
		source_file = "" if pd.isna(row.source_file) else str(row.source_file)

		key = (normalize_text(czech), normalize_text(english))
		if key == ("", ""):
			continue

		if key in existing_keys or key in seen_in_batch:
			conflicts.append((czech, english, source_file))
			continue

		seen_in_batch.add(key)
		to_append.append({"czech": czech, "english": english})

	if conflicts:
		print("Conflicting rows (already exist in tracker/already_used.csv):")
		for czech, english, source_file in conflicts:
			print(f"  source={source_file} czech={czech!r}, english={english!r}")

	if not to_append:
		print("No new rows to append into tracker/already_used.csv")
		return

	append_df = pd.DataFrame(to_append)
	updated_df = pd.concat([existing_df[["czech", "english"]], append_df], ignore_index=True)
	updated_df.to_csv(already_used_csv, index=False)
	print(f"Updated: {already_used_csv}")
	print(f"  Appended rows: {len(append_df)}")
	print(f"  Total rows: {len(updated_df)}")


def filter_target_file(target_csv: Path, source_keys: set[tuple[str, str]]) -> None:
	if not target_csv.exists():
		print(f"Skipping missing target file: {target_csv}")
		return

	second_df = pd.read_csv(target_csv)
	if "czech" not in second_df.columns or "english" not in second_df.columns:
		raise ValueError(f"Missing column 'czech' or 'english' in target file: {target_csv}")

	target_keys = list(
		zip(
			second_df["czech"].map(normalize_text),
			second_df["english"].map(normalize_text),
		)
	)
	keep_mask = [(key == ("", "")) or (key not in source_keys) for key in target_keys]
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
		target_folder / "10k_words.csv",
		target_folder / "200_words.csv",
	]

	source_keys = collect_czech_english_keys_from_folder(source_folder)
	print(f"Collected {len(source_keys)} unique czech/english pairs from: {source_folder}")
	update_already_used_csv(source_folder, target_folder)

	for target_csv in target_files:
		filter_target_file(target_csv, source_keys)


if __name__ == "__main__":
	main()
