import asyncio
import html
import re
import shutil
import subprocess
import unicodedata
import os
from collections.abc import Awaitable
import pandas as pd
from dotenv import load_dotenv
import google.cloud.texttospeech as texttospeech

# Now the GOOGLE_APPLICATION_CREDENTIALS variable is available
load_dotenv()
credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
print(f"Using credentials from: {credentials_path}")

def trim_audio(
    audio_content: bytes,
    *,
    trim_start: bool = True,
    trim_end: bool = True,
    silence_threshold_db: int = -50,
    min_silence_ms: int = 250,
    keep_silence_ms: int = 100,
) -> bytes:
    """Remove configured leading/trailing silence while preserving a margin."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("Warning: ffmpeg is unavailable; saving generated audio without trimming")
        return audio_content

    try:
        start_filter = (
            f"start_periods=1:start_duration={min_silence_ms / 1000}:"
            f"start_threshold={silence_threshold_db}dB:start_silence={keep_silence_ms / 1000}"
            if trim_start
            else "start_periods=0"
        )
        end_filter = (
            f"stop_periods=1:stop_duration={min_silence_ms / 1000}:"
            f"stop_threshold={silence_threshold_db}dB:stop_silence={keep_silence_ms / 1000}"
            if trim_end
            else "stop_periods=0"
        )
        result = subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                "pipe:0",
                "-af",
                f"silenceremove={start_filter}:{end_filter}",
                "-c:a",
                "libopus",
                "-f",
                "ogg",
                "pipe:1",
            ],
            input=audio_content,
            capture_output=True,
            check=True,
        )
        if not result.stdout:
            return audio_content
        return result.stdout
    except (OSError, subprocess.CalledProcessError) as error:
        # A trim failure must not discard an otherwise valid generated recording.
        print(f"Warning: could not trim generated audio: {error}")
        return audio_content

async def generate_audio_with_google_cloud(
    df: pd.DataFrame,
    audio_folder: str,
    suffix: str = "",
    language_code: str = "en-GB",
) -> pd.DataFrame:
    if texttospeech is None:
        raise ImportError("Missing dependency: google-cloud-texttospeech. Install with 'pip install google-cloud-texttospeech'.")

    client = texttospeech.TextToSpeechClient()
    audio_tasks: list[Awaitable[None]] = []
    audio_names: list[str] = []

    # Better defaults for language learning: clear female voice with slower pace.
    voice_name = os.getenv("GCP_TTS_VOICE_NAME", "en-GB-Neural2-C")
    speaking_rate_raw = os.getenv("GCP_TTS_SPEAKING_RATE", "1")
    pitch_raw = os.getenv("GCP_TTS_PITCH", "0.0")
    try:
        speaking_rate = float(speaking_rate_raw)
    except ValueError:
        speaking_rate = 1
    try:
        pitch = float(pitch_raw)
    except ValueError:
        pitch = 0.0

    def clean_filename(filename: str) -> str:
        filename = filename.lower()
        # Normalize to remove accents
        filename = unicodedata.normalize('NFD', filename)
        filename = ''.join(char for char in filename if unicodedata.category(char) != 'Mn')  # Remove diacritical marks
        filename = re.sub(r'[^\w\s]', '', filename)  # Remove special characters (keep alphanumeric and spaces)
        filename = filename.replace(" ", "_")  # Replace spaces with underscores
        return filename

    def add_extension(filename: str) -> str:
        return filename + ".opus"

    # ...existing code...

    def save_audio(audio_content, path):
        try:
            with open(path, "wb") as out:
                out.write(audio_content)
        except Exception as e:
            print(f"Error saving audio file {path}: {e}")

    os.makedirs(audio_folder, exist_ok=True)

    # Process audio files from english column

    for english in df["english"]:
        cleaned_word = clean_filename(str(english))
        if not cleaned_word:
            continue

        audio_name = f"{cleaned_word}{suffix}"
        extension_word = add_extension(audio_name)
        audio_names.append(extension_word)

        audio_path = os.path.join(audio_folder, extension_word)
        if os.path.exists(audio_path):
            print(f"Skipping (audio already exists): {audio_path}")
            continue

        try:
            synthesis_input = texttospeech.SynthesisInput(text=str(english))

            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name,
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
            )

            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.OGG_OPUS,
                speaking_rate=speaking_rate,
                pitch=pitch,
            )

            response = client.synthesize_speech(
                input=synthesis_input, voice=voice, audio_config=audio_config
            )

            audio_tasks.append(asyncio.to_thread(save_audio, response.audio_content, audio_path))
            print(f"Queued audio generation with Google Cloud: {extension_word}")
        except Exception as e:
            print(f"Error generating audio for word '{english}': {e}")

    await asyncio.gather(*audio_tasks)
    df["audio"] = audio_names
    return df


async def generate_audio_with_google_cloud_from_ipa(
    df: pd.DataFrame,
    audio_folder: str,
    suffix: str = "",
    language_code: str = "en-US",
    overwrite_existing: bool = False,
) -> pd.DataFrame:
    if texttospeech is None:
        raise ImportError("Missing dependency: google-cloud-texttospeech. Install with 'pip install google-cloud-texttospeech'.")

    client = texttospeech.TextToSpeechClient()
    audio_tasks: list[Awaitable[None]] = []
    audio_names: list[str] = []

    voice_name = os.getenv("GCP_TTS_IPA_VOICE_NAME", "en-US-Neural2-F")
    speaking_rate = _get_float_env("GCP_TTS_SPEAKING_RATE", 1)
    pitch = _get_float_env("GCP_TTS_PITCH", 0.0)

    os.makedirs(audio_folder, exist_ok=True)

    for _, row in df.iterrows():
        english, ipa_pronunciation = _get_ipa_values(row)
        extension_word = _get_audio_filename(english, suffix)
        if not extension_word:
            continue

        audio_names.append(extension_word)
        audio_path = os.path.join(audio_folder, extension_word)
        if os.path.exists(audio_path) and not overwrite_existing:
            print(f"Skipping (audio already exists): {audio_path}")
            continue

        if not ipa_pronunciation:
            print(f"Skipping (missing IPA pronunciation): {english}")
            continue

        audio_task = _create_ipa_audio_task(
            client,
            english,
            ipa_pronunciation,
            audio_path,
            extension_word,
            language_code,
            voice_name,
            speaking_rate,
            pitch,
        )
        if audio_task is not None:
            audio_tasks.append(audio_task)

    await asyncio.gather(*audio_tasks)
    df["audio"] = audio_names
    return df


def _get_float_env(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _clean_audio_filename(filename: str) -> str:
    filename = filename.lower()
    filename = unicodedata.normalize("NFD", filename)
    filename = "".join(
        char for char in filename if unicodedata.category(char) != "Mn"
    )
    filename = re.sub(r"[^\w\s]", "", filename)
    return filename.replace(" ", "_")


def _get_audio_filename(english: str, suffix: str) -> str:
    cleaned_word = _clean_audio_filename(english)
    if not cleaned_word:
        return ""
    return f"{cleaned_word}{suffix}.opus"


def _get_ipa_values(row) -> tuple[str, str]:
    english = str(row.get("english", ""))
    pronunciation_value = row.get("pronunciation", "")
    ipa_pronunciation = "" if pd.isna(pronunciation_value) else str(pronunciation_value).strip()
    if ipa_pronunciation.startswith("/") and ipa_pronunciation.endswith("/"):
        ipa_pronunciation = ipa_pronunciation[1:-1].strip()
    return english, ipa_pronunciation


def _create_ipa_audio_task(
    client,
    english: str,
    ipa_pronunciation: str,
    audio_path: str,
    extension_word: str,
    language_code: str,
    voice_name: str,
    speaking_rate: float,
    pitch: float,
) -> Awaitable[None] | None:
    try:
        ssml = (
            f'<speak><phoneme alphabet="ipa" ph="'
            f'{html.escape(ipa_pronunciation, quote=True)}">'
            f'{html.escape(english)}</phoneme></speak>'
        )
        synthesis_input = texttospeech.SynthesisInput(ssml=ssml)
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.OGG_OPUS,
            speaking_rate=speaking_rate,
            pitch=pitch,
        )
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        print(f"Queued IPA audio generation with Google Cloud: {extension_word}")
        return asyncio.to_thread(_save_audio_content, response.audio_content, audio_path)
    except Exception as error:
        print(
            f"Error generating IPA audio for word "
            f"'{english}' (IPA {ascii(ipa_pronunciation)}): {error}"
        )
        return None


def _save_audio_content(audio_content, path: str) -> None:
    try:
        with open(path, "wb") as out:
            out.write(audio_content)
    except Exception as error:
        print(f"Error saving audio file {path}: {error}")

# Function to save audio asynchronously
async def async_save_audio(tts, filename):
    await asyncio.to_thread(tts.save, filename)


