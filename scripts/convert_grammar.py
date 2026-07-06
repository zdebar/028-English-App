#!/usr/bin/env python3
"""Convert grammar note HTML in CSV rows to dl.grammar-pairs blocks."""

import argparse
import csv
import html
import re


CLASS_ATTR_RE = re.compile(r"\sclass=(['\"]).*?\1", re.IGNORECASE | re.DOTALL)
P_BLOCK_RE = re.compile(r"<p\b[^>]*>.*?</p>", re.IGNORECASE | re.DOTALL)
PAIR_RE = re.compile(
    r"^\s*<p\b[^>]*>\s*(?:<span\b[^>]*>(?P<cz>.*?)</span>\s*)?<b\b[^>]*>(?P<en>.*?)</b>\s*</p>\s*$",
    re.IGNORECASE | re.DOTALL,
)
B_TAG_RE = re.compile(r"<b\b[^>]*>.*?</b>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>", re.DOTALL)


def _strip_classes(fragment: str) -> str:
    return CLASS_ATTR_RE.sub("", fragment)


def _normalize_text(value: str) -> str:
    without_tags = TAG_RE.sub("", value)
    decoded = html.unescape(without_tags)
    return " ".join(decoded.split())


def _extract_pair(paragraph_html: str) -> tuple[str, str] | None:
    """Extract a Czech/English pair from one paragraph, or return None when it is not a pair."""
    match = PAIR_RE.match(paragraph_html)
    if not match:
        return None

    en = _normalize_text(match.group("en") or "")
    if not en:
        return None

    cz_group = match.group("cz")
    if cz_group is not None:
        cz = _normalize_text(cz_group)
    else:
        without_bold = B_TAG_RE.sub("", paragraph_html)
        without_p = re.sub(r"(^\s*<p\b[^>]*>)|(</p>\s*$)", "", without_bold, flags=re.IGNORECASE | re.DOTALL)
        cz = _normalize_text(without_p)

    return cz, en


def _build_pairs_block(pairs: list[tuple[str, str]]) -> str:
    parts = ["<dl class='grammar-pairs'>"]
    for cz, en in pairs:
        parts.append(f"<dt>{html.escape(cz)}</dt><dd>{html.escape(en)}</dd>")
    parts.append("</dl>")
    return "".join(parts)


def _tokenize_paragraphs(note_html: str) -> list[tuple[str, str]]:
    tokens: list[tuple[str, str]] = []
    pos = 0
    for match in P_BLOCK_RE.finditer(note_html):
        if match.start() > pos:
            tokens.append(("other", note_html[pos:match.start()]))
        tokens.append(("p", match.group(0)))
        pos = match.end()

    if pos < len(note_html):
        tokens.append(("other", note_html[pos:]))

    return tokens


def _collect_consecutive_pairs(tokens: list[tuple[str, str]], start_index: int) -> tuple[list[tuple[str, str]], int]:
    first_type, first_value = tokens[start_index]
    if first_type != "p":
        return [], start_index + 1

    first_pair = _extract_pair(first_value)
    if not first_pair:
        return [], start_index + 1

    pairs = [first_pair]
    index = start_index + 1
    while index < len(tokens):
        token_type, token_value = tokens[index]
        if token_type == "other" and token_value.strip() == "":
            index += 1
            continue
        if token_type != "p":
            break

        pair = _extract_pair(token_value)
        if not pair:
            break

        pairs.append(pair)
        index += 1

    return pairs, index


def convert_note(note_html: str) -> str:
    """Convert consecutive pair paragraphs in one note HTML fragment into grammar-pairs blocks."""
    if not note_html:
        return ""

    tokens = _tokenize_paragraphs(note_html)
    output: list[str] = []
    i = 0

    while i < len(tokens):
        token_type, token_value = tokens[i]
        if token_type == "other":
            output.append(_strip_classes(token_value))
            i += 1
            continue

        pairs, next_index = _collect_consecutive_pairs(tokens, i)
        if not pairs:
            output.append(_strip_classes(token_value))
            i += 1
            continue

        output.append(_build_pairs_block(pairs))
        i = next_index

    return "".join(output)


def process_csv(input_path: str, output_path: str) -> None:
    """Read a grammar CSV, convert its note/NOTE column, and write the converted CSV."""
    with open(input_path, "r", encoding="utf-8", newline="") as src:
        sample = src.read(2048)
        src.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample)
        except csv.Error:
            dialect = csv.excel

        reader = csv.DictReader(src, dialect=dialect)
        fieldnames = reader.fieldnames or []

        note_key = None
        if "note" in fieldnames:
            note_key = "note"
        elif "NOTE" in fieldnames:
            note_key = "NOTE"

        with open(output_path, "w", encoding="utf-8", newline="") as dst:
            writer = csv.DictWriter(dst, fieldnames=fieldnames, dialect=dialect, quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()

            for row in reader:
                if note_key:
                    row[note_key] = convert_note(row.get(note_key, "") or "")
                writer.writerow(row)


def main() -> None:
    """Parse command-line paths and convert the configured grammar CSV."""
    parser = argparse.ArgumentParser(description="Convert grammar CSV notes to dl.grammar-pairs")
    parser.add_argument("--input", "-i", default="data/grammar.csv", help="Input CSV file")
    parser.add_argument("--output", "-o", default="data/grammar-converted.csv", help="Output CSV file")
    args = parser.parse_args()

    process_csv(args.input, args.output)
    print(f"Wrote converted CSV to {args.output}")


if __name__ == "__main__":
    main()
