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
    df = pd.read_csv(file_path, skipinitialspace=True)
    for col in columns:
        if col not in df.columns:
            df[col] = ""
    df = df[columns]
    return df

def redo_Id(df, start_id=1):
    df = df.copy()
    df['id'] = range(start_id, start_id + len(df))
    return df

def redo_sort_order(df, start_sort_order=1):
    df = df.copy()
    df['sort_order'] = range(start_sort_order, start_sort_order + len(df))
    return df