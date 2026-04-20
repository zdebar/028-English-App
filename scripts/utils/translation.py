import requests
from dotenv import load_dotenv
import pandas as pd
import os

# Load environment variables from .env file
load_dotenv()

def fill_missing_czech(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fills missing Czech translations in the DataFrame using Google Translate.
    Only updates rows where 'czech' is empty.
    """
    # Find indices and English words needing translation
    missing_indices = []
    missing_english = []
    for idx, row in df.iterrows():
        if not row.get("czech"):
            english = row.get("english", "")
            if english:
                missing_indices.append(idx)
                missing_english.append(english)

    if missing_english:
        try:
            translations = bulk_translate_to_czech_google_translate(missing_english)
            for idx, translation in zip(missing_indices, translations):
                df.at[idx, "czech"] = translation
        except Exception as e:
            print(f"Bulk translation failed: {e}")
    return df

def bulk_translate_to_czech_google_translate(texts):
    """
    Translates a list of English texts to Czech using Google Translate API (bulk).
    Returns a list of translated texts (empty string if not translated).
    """
    api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_TRANSLATE_API_KEY is not set in the .env file.")

    url = "https://translation.googleapis.com/language/translate/v2"
    headers = {"Content-Type": "application/json"}
    payload = {
        "q": texts,
        "source": "en",
        "target": "cs",
        "format": "text",
        "key": api_key
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json()
    except requests.RequestException as e:
        raise ConnectionError(f"Network error: {e}") from e

    if response.status_code == 200 and "data" in response_data:
        translations = response_data["data"].get("translations", [])
        return [t.get("translatedText", "") for t in translations]
    else:
        error_message = response_data.get("error", {}).get("message", "Unknown error")
        raise RuntimeError(f"Translation API error: {error_message}")

def translate_to_czech_google_translate(text: str) -> str:
    """
    Translates a given text from English to Czech using the Google Translate API.
    """
    api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_TRANSLATE_API_KEY is not set in the .env file.")

    url = "https://translation.googleapis.com/language/translate/v2"
    headers = {"Content-Type": "application/json"}
    payload = {
        "q": text,
        "source": "en",
        "target": "cs",
        "format": "text",
        "key": api_key
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json()
    except requests.RequestException as e:
        raise ConnectionError(f"Network error: {e}") from e

    if response.status_code == 200 and "data" in response_data:
        translations = response_data["data"].get("translations", [])
        if translations and "translatedText" in translations[0]:
            return translations[0]["translatedText"]
        else:
            return ""
    else:
        error_message = response_data.get("error", {}).get("message", "Unknown error")
        raise RuntimeError(f"Translation API error: {error_message}")
        



