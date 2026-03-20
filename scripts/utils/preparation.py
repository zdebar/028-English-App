import asyncio
import os

import pandas as pd
from typing import List, Union

def clean_DataFrame(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the DataFrame by removing empty rows and stripping whitespace from string values.
    """
    df = df.map(lambda x: str(x).strip() if isinstance(x, str) else x)
    df = df.dropna(how="all")    
    return df

def read_vocab_csv(
    file_path: str,
    columns: List[str] = [
        "id", "czech", "english", "pronunciation", "audio", "sort_order", "grammar_id", "lesson_id"
    ],
) -> pd.DataFrame:
    """
    Reads a CSV file, ensures specified columns exist, and cleans the DataFrame.

    :param file_path: Relative path to the CSV file.
    :param columns: List of column names to include.
    :return: DataFrame with the specified columns.
    """
    int_columns = {"id", "sort_order", "grammar_id", "lesson_id"}
    def _clean_and_convert_col(col, value):
        if pd.isna(value) or isinstance(value, bool):
            return value
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value) if col in int_columns and value.is_integer() else value
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return ""
            if col in int_columns:
                if stripped.lstrip("+-").isdigit():
                    return int(stripped)
                try:
                    parsed_float = float(stripped)
                except ValueError:
                    return stripped
                return int(parsed_float) if parsed_float.is_integer() else stripped
            return stripped
        return value

    df = pd.read_csv(file_path, skipinitialspace=True)
    for col in columns:
        if col not in df.columns:
            df[col] = ""
    df = df[columns]
    for col in df.columns:
        df[col] = df[col].apply(lambda v: _clean_and_convert_col(col, v))
    return df

def redo_Id(df, start_id=1):
    df = df.copy()
    df['id'] = range(start_id, start_id + len(df))
    return df

def redo_sort_order(df, file_name: str = "", start_sort_order: int = 1):
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