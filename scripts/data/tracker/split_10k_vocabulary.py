import csv
from pathlib import Path


WORDS_PER_FILE = 48
FIRST_FILE_NUMBER = 100
INPUT_FILE_NAME = "10k_words.csv"
OUTPUT_FILE_SUFFIX = "_vocabulary.csv"
OUTPUT_HEADERS = ["czech", "english", "", ""]


def read_words(input_path: Path) -> list[list[str]]:
    with input_path.open("r", newline="", encoding="utf-8") as input_file:
        reader = csv.reader(input_file)
        headers = next(reader, None)

        if headers is None or headers[:2] != ["czech", "english"]:
            raise ValueError("Input CSV must start with the czech,english columns.")

        words = []
        for row_number, row in enumerate(reader, start=2):
            if not row or not any(row):
                continue
            if len(row) < 2:
                raise ValueError(f"Row {row_number} does not contain czech and english values.")
            words.append(row[:2])

        return words


def write_batches(words: list[list[str]], output_dir: Path) -> int:
    file_count = 0

    for start in range(0, len(words), WORDS_PER_FILE):
        file_number = FIRST_FILE_NUMBER + file_count
        output_path = output_dir / f"{file_number}{OUTPUT_FILE_SUFFIX}"
        batch = words[start : start + WORDS_PER_FILE]

        with output_path.open("w", newline="", encoding="utf-8") as output_file:
            writer = csv.writer(output_file)
            writer.writerow(OUTPUT_HEADERS)
            writer.writerows([word + ["", ""] for word in batch])

        print(f"Created {output_path.name} ({len(batch)} words)")
        file_count += 1

    return file_count


def main() -> None:
    output_dir = Path(__file__).resolve().parent
    words = read_words(output_dir / INPUT_FILE_NAME)
    file_count = write_batches(words, output_dir)
    print(f"Created {file_count} files from {len(words)} words.")


if __name__ == "__main__":
    main()
