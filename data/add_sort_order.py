import csv
from pathlib import Path


IN_FILE = Path(__file__).with_name("merged.csv")
OUT_FILE = Path(__file__).with_name("merged_updated.csv")
INCREMENT = 50


def read_rows() -> list[list[str]]:
    with IN_FILE.open("r", encoding="utf-8-sig", newline="") as source:
        return list(csv.reader(source))


def find_sort_order_index(header: list[str]) -> int | None:
    try:
        return header.index("sort_order")
    except ValueError:
        return None


def update_row(row: list[str], sort_order_index: int, row_number: int) -> list[str]:
    updated_row = row.copy()
    if sort_order_index >= len(updated_row):
        return updated_row

    value = updated_row[sort_order_index].strip()
    if not value:
        return updated_row

    try:
        updated_row[sort_order_index] = str(int(value) + INCREMENT)
    except ValueError as error:
        raise ValueError(
            f"Nečíselná hodnota ve sloupci 'sort_order' na řádku "
            f"{row_number}: {value!r}"
        ) from error

    return updated_row


def update_rows(rows: list[list[str]]) -> tuple[list[list[str]], bool]:
    header = rows[0]
    sort_order_index = find_sort_order_index(header)
    if sort_order_index is None:
        return rows, False

    updated_rows = [header]
    for row_number, row in enumerate(rows[1:], start=2):
        updated_rows.append(update_row(row, sort_order_index, row_number))

    return updated_rows, True


def write_rows(rows: list[list[str]]) -> None:
    with OUT_FILE.open("w", encoding="utf-8", newline="") as target:
        csv.writer(target, lineterminator="\n").writerows(rows)


def main() -> None:
    if not IN_FILE.exists():
        raise FileNotFoundError(f"Soubor nebyl nalezen: {IN_FILE}")

    rows = read_rows()
    if not rows:
        OUT_FILE.write_text("", encoding="utf-8")
        print("Soubor je prázdný.")
        return

    updated_rows, was_updated = update_rows(rows)
    write_rows(updated_rows)

    if was_updated:
        print(f"Hotovo. Upravený soubor: {OUT_FILE}")
        return

    print("Sloupec 'sort_order' nebyl nalezen. Data nebyla změněna.")


if __name__ == "__main__":
    main()
