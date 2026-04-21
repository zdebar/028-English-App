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


def has_czech_column(df: pd.DataFrame) -> bool:
	return "czech" in df.columns


def require_english_column(df: pd.DataFrame, csv_path: Path, kind: str) -> None:
	if "english" not in df.columns:
		raise ValueError(f"Missing column 'english' in {kind} file: {csv_path}")


def collect_source_match_keys(folder: Path) -> tuple[set[tuple[str, str]], set[str], set[str]]:
	if not folder.exists():
		raise FileNotFoundError(f"Source folder does not exist: {folder}")

	bilingual_keys: set[tuple[str, str]] = set()
	english_only_keys: set[str] = set()
	all_english_keys: set[str] = set()

	for csv_path in sorted(folder.glob("*.csv")):
		df = pd.read_csv(csv_path)
		require_english_column(df, csv_path, "source")
		file_has_czech = has_czech_column(df)

		for row in df.itertuples(index=False):
			english = normalize_text(getattr(row, "english", ""))
			if english == "":
				continue

			all_english_keys.add(english)
			if file_has_czech:
				czech = normalize_text(getattr(row, "czech", ""))
				bilingual_keys.add((czech, english))
			else:
				english_only_keys.add(english)

	return bilingual_keys, english_only_keys, all_english_keys


def collect_czech_english_keys_from_folder(folder: Path) -> set[tuple[str, str]]:
	bilingual_keys, _, _ = collect_source_match_keys(folder)
	return bilingual_keys


def collect_czech_english_rows_from_folder(folder: Path) -> pd.DataFrame:
	if not folder.exists():
		raise FileNotFoundError(f"Source folder does not exist: {folder}")

	rows: list[pd.DataFrame] = []
	for csv_path in sorted(folder.glob("*.csv")):
		df = pd.read_csv(csv_path)
		require_english_column(df, csv_path, "source")
		if not has_czech_column(df):
			df = df.copy()
			df["czech"] = ""

		subset = df[["czech", "english"]].copy()
		subset["source_file"] = csv_path.name
		rows.append(subset)

	if not rows:
		return pd.DataFrame(columns=["czech", "english", "source_file"])

	return pd.concat(rows, ignore_index=True)


def ensure_already_used_csv(tracker_folder: Path) -> Path:
	tracker_folder.mkdir(parents=True, exist_ok=True)
	already_used_csv = tracker_folder / "already_used.csv"

	if not already_used_csv.exists():
		pd.DataFrame(columns=["czech", "english"]).to_csv(already_used_csv, index=False)
		print(f"Created: {already_used_csv}")

	return already_used_csv


def read_tracker_rows(already_used_csv: Path) -> pd.DataFrame:
	existing_df = pd.read_csv(already_used_csv)
	if "czech" not in existing_df.columns or "english" not in existing_df.columns:
		raise ValueError(f"Missing column 'czech' or 'english' in tracker file: {already_used_csv}")
	return existing_df


def prepare_existing_keys(existing_df: pd.DataFrame) -> tuple[set[tuple[str, str]], set[str]]:
	existing_keys = set(
		zip(
			existing_df["czech"].map(normalize_text),
			existing_df["english"].map(normalize_text),
		)
	)
	existing_english_keys = set(existing_df["english"].map(normalize_text))
	return existing_keys, existing_english_keys


def parse_source_row(row: Any) -> tuple[str, str, str, tuple[str, str]]:
	czech = "" if pd.isna(row.czech) else str(row.czech).strip()
	english = "" if pd.isna(row.english) else str(row.english).strip()
	source_file = "" if pd.isna(row.source_file) else str(row.source_file)
	key = (normalize_text(czech), normalize_text(english))
	return czech, english, source_file, key


def handle_english_only_row(
	key: tuple[str, str],
	czech: str,
	english: str,
	source_file: str,
	existing_english_keys: set[str],
	seen_english_in_batch: set[str],
	conflicts: list[tuple[str, str, str]],
) -> bool:
	if key[1] in existing_english_keys or key[1] in seen_english_in_batch:
		conflicts.append((czech, english, source_file))
		return False

	seen_english_in_batch.add(key[1])
	return True


def handle_bilingual_row(
	key: tuple[str, str],
	czech: str,
	english: str,
	source_file: str,
	existing_keys: set[tuple[str, str]],
	seen_in_batch: set[tuple[str, str]],
	conflicts: list[tuple[str, str, str]],
) -> bool:
	if key in existing_keys or key in seen_in_batch:
		conflicts.append((czech, english, source_file))
		return False

	seen_in_batch.add(key)
	return True


def process_tracker_row(
	czech: str,
	english: str,
	source_file: str,
	key: tuple[str, str],
	existing_keys: set[tuple[str, str]],
	existing_english_keys: set[str],
	seen_in_batch: set[tuple[str, str]],
	seen_english_in_batch: set[str],
	to_append: list[dict[str, str]],
	conflicts: list[tuple[str, str, str]],
) -> None:
	if key[1] == "":
		return

	if key[0] == "":
		should_append = handle_english_only_row(
			key,
			czech,
			english,
			source_file,
			existing_english_keys,
			seen_english_in_batch,
			conflicts,
		)
		if not should_append:
			return
	else:
		should_append = handle_bilingual_row(
			key,
			czech,
			english,
			source_file,
			existing_keys,
			seen_in_batch,
			conflicts,
		)
		if not should_append:
			return

	to_append.append({"czech": czech, "english": english})


def build_tracker_updates(
	source_rows: pd.DataFrame,
	existing_keys: set[tuple[str, str]],
	existing_english_keys: set[str],
) -> tuple[list[dict[str, str]], list[tuple[str, str, str]]]:
	conflicts: list[tuple[str, str, str]] = []
	to_append: list[dict[str, str]] = []
	seen_in_batch: set[tuple[str, str]] = set()
	seen_english_in_batch: set[str] = set()

	for row in source_rows.itertuples(index=False):
		czech, english, source_file, key = parse_source_row(row)
		process_tracker_row(
			czech,
			english,
			source_file,
			key,
			existing_keys,
			existing_english_keys,
			seen_in_batch,
			seen_english_in_batch,
			to_append,
			conflicts,
		)

	return to_append, conflicts


def print_conflicts(conflicts: list[tuple[str, str, str]]) -> None:
	if not conflicts:
		return

	print("Conflicting rows (already exist in tracker/already_used.csv):")
	for czech, english, source_file in conflicts:
		print(f"  source={source_file} czech={czech!r}, english={english!r}")


def save_tracker_updates(
	already_used_csv: Path,
	existing_df: pd.DataFrame,
	to_append: list[dict[str, str]],
) -> None:
	if not to_append:
		print("No new rows to append into tracker/already_used.csv")
		return

	append_df = pd.DataFrame(to_append)
	updated_df = pd.concat([existing_df[["czech", "english"]], append_df], ignore_index=True)
	updated_df.to_csv(already_used_csv, index=False)
	print(f"Updated: {already_used_csv}")
	print(f"  Appended rows: {len(append_df)}")
	print(f"  Total rows: {len(updated_df)}")


def update_already_used_csv(source_folder: Path, tracker_folder: Path) -> None:
	already_used_csv = ensure_already_used_csv(tracker_folder)
	existing_df = read_tracker_rows(already_used_csv)

	source_rows = collect_czech_english_rows_from_folder(source_folder)
	if source_rows.empty:
		print(f"No source rows found in: {source_folder}")
		return

	existing_keys, existing_english_keys = prepare_existing_keys(existing_df)
	to_append, conflicts = build_tracker_updates(source_rows, existing_keys, existing_english_keys)
	print_conflicts(conflicts)
	save_tracker_updates(already_used_csv, existing_df, to_append)


def filter_target_file(
	target_csv: Path,
	source_bilingual_keys: set[tuple[str, str]],
	source_english_only_keys: set[str],
	source_all_english_keys: set[str],
) -> None:
	if not target_csv.exists():
		print(f"Skipping missing target file: {target_csv}")
		return

	second_df = pd.read_csv(target_csv)
	require_english_column(second_df, target_csv, "target")
	target_has_czech = has_czech_column(second_df)

	if target_has_czech:
		target_keys = list(
			zip(
				second_df["czech"].map(normalize_text),
				second_df["english"].map(normalize_text),
			)
		)
		keep_mask = [
			(key[1] == "")
			or (
				key not in source_bilingual_keys
				and key[1] not in source_english_only_keys
			)
			for key in target_keys
		]
	else:
		target_english_keys = second_df["english"].map(normalize_text)
		keep_mask = [english == "" or english not in source_all_english_keys for english in target_english_keys]

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
		target_folder / "1k_words.csv",
		target_folder / "200_words.csv",
	]

	source_bilingual_keys, source_english_only_keys, source_all_english_keys = collect_source_match_keys(source_folder)
	print(
		f"Collected {len(source_bilingual_keys)} unique czech/english pairs and "
		f"{len(source_english_only_keys)} english-only keys from: {source_folder}"
	)
	update_already_used_csv(source_folder, target_folder)

	for target_csv in target_files:
		filter_target_file(
			target_csv,
			source_bilingual_keys,
			source_english_only_keys,
			source_all_english_keys,
		)


if __name__ == "__main__":
	main()
