from pathlib import Path
import csv

OUTPUT_FILE = "merged.csv"


def merge_csv_files() -> None:
    folder = Path(__file__).resolve().parent

    csv_files = sorted(
        file for file in folder.glob("*.csv")
        if file.name != OUTPUT_FILE
    )

    if not csv_files:
        print("No CSV files found.")
        return

    expected_columns: list[str] | None = None
    all_rows: list[dict[str, str]] = []

    for csv_file in csv_files:
        with csv_file.open("r", encoding="utf-8-sig", newline="") as file:
            reader = csv.DictReader(file)

            if reader.fieldnames is None:
                print(f"ERROR: {csv_file.name} has no header row.")
                print("Merge cancelled.")
                return

            columns = list(reader.fieldnames)

            if expected_columns is None:
                expected_columns = columns
            elif columns != expected_columns:
                print(f"ERROR: Column mismatch in {csv_file.name}")
                print(f"Expected: {expected_columns}")
                print(f"Found:    {columns}")
                print("Merge cancelled. No output file was created.")
                return

            all_rows.extend(reader)

    if expected_columns is None:
        print("No valid CSV headers found.")
        return

    output_path = folder / OUTPUT_FILE

    with output_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=expected_columns
        )
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"Merged {len(csv_files)} files into:")
    print(output_path)


if __name__ == "__main__":
    merge_csv_files()
