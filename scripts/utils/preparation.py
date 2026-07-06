import asyncio
import os

import pandas as pd
from typing import Any, List, Union

INT_COLUMNS = {"id", "sort_order", "grammar_id", "lesson_id", "block_id", "note_id"}


def clean_data_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Strip string cells and drop rows that are entirely empty."""
    df = df.map(lambda x: str(x).strip() if isinstance(x, str) else x)
    df = df.dropna(how="all")
    return df


def _convert_float_for_int_column(value: float) -> Union[int, float]:
    return int(value) if value.is_integer() else value


def _parse_int_from_string(stripped: str) -> Union[int, str]:
    if stripped.lstrip("+-").isdigit():
        return int(stripped)

    try:
        parsed_float = float(stripped)
    except ValueError:
        return stripped

    return int(parsed_float) if parsed_float.is_integer() else stripped


def _clean_and_convert_col(col: str, value: Any) -> Any:
    if pd.isna(value) or isinstance(value, bool):
        return value

    if isinstance(value, int):
        return value

    if isinstance(value, float):
        if col in INT_COLUMNS:
            return _convert_float_for_int_column(value)
        return value

    if not isinstance(value, str):
        return value

    stripped = value.strip()
    if not stripped:
        return ""

    if col not in INT_COLUMNS:
        return stripped

    return _parse_int_from_string(stripped)

def read_vocab_csv(
    file_path: str,
    columns: List[str] = [
        "id", "czech", "english", "pronunciation", "audio", "sort_order", "grammar_id", "lesson_id", "block_id", "note_id"
    ],
) -> pd.DataFrame:
    """Read a vocabulary CSV, add missing requested columns, and normalize configured int columns."""
    df = pd.read_csv(file_path, skipinitialspace=True)

    # Keep id only when present in source data; do not create it automatically.
    effective_columns = [col for col in columns if col != "id" or col in df.columns]

    for col in effective_columns:
        if col not in df.columns:
            df[col] = ""
    df = df[effective_columns]
    for col in df.columns:
        df[col] = df[col].map(lambda v, col=col: _clean_and_convert_col(col, v))
    return df

def redo_id(df, start_id=1):
    """Return a copy with sequential id values starting at start_id."""
    df = df.copy()
    df['id'] = range(start_id, start_id + len(df))
    return df

def redo_sort_order(df, file_name: str = "", start_sort_order: int = 1):
    """Return a copy with sequential sort_order values, optionally based on leading file digits."""
    if file_name:
        base_name = os.path.basename(file_name)
        leading_digits = ""
        for char in base_name:
            if char.isdigit():
                leading_digits += char
            else:
                break
        if leading_digits:
            start_sort_order = int(leading_digits) * 1000

    df = df.copy()
    df['sort_order'] = range(start_sort_order, start_sort_order + len(df))
    return df

def add_lesson_id(df, file_name: str = ""):
    """Return a copy with lesson_id set from leading digits in file_name, or blank when absent."""
    base_name = os.path.basename(file_name) if file_name else ""
    leading_digits = ""
    for char in base_name:
        if char.isdigit():
            leading_digits += char
        else:
            break
    lesson_id = int(leading_digits) if leading_digits else ""
    df = df.copy()
    df['lesson_id'] = lesson_id
    return df
