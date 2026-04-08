import asyncio
import html
import re
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

async def generate_audio_with_google_cloud(
    df: pd.DataFrame,
    audio_folder: str,
    suffix: str = "",
    language_code: str = "en-US",
) -> pd.DataFrame:
    if texttospeech is None:
        raise ImportError("Missing dependency: google-cloud-texttospeech. Install with 'pip install google-cloud-texttospeech'.")

    client = texttospeech.TextToSpeechClient()
    audio_tasks: list[Awaitable[None]] = []
    audio_names: list[str] = []

    # Better defaults for language learning: clear female voice with slower pace.
    voice_name = os.getenv("GCP_TTS_VOICE_NAME", "en-US-Neural2-F")
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
) -> pd.DataFrame:
    if texttospeech is None:
        raise ImportError("Missing dependency: google-cloud-texttospeech. Install with 'pip install google-cloud-texttospeech'.")

    client = texttospeech.TextToSpeechClient()
    audio_tasks: list[Awaitable[None]] = []
    audio_names: list[str] = []

    voice_name = os.getenv("GCP_TTS_VOICE_NAME", "en-US-Neural2-F")
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
        filename = unicodedata.normalize('NFD', filename)
        filename = ''.join(char for char in filename if unicodedata.category(char) != 'Mn')
        filename = re.sub(r'[^\w\s]', '', filename)
        filename = filename.replace(" ", "_")
        return filename

    def add_extension(filename: str) -> str:
        return filename + ".opus"

    def save_audio(audio_content, path):
        try:
            with open(path, "wb") as out:
                out.write(audio_content)
        except Exception as e:
            print(f"Error saving audio file {path}: {e}")

    os.makedirs(audio_folder, exist_ok=True)

    for _, row in df.iterrows():
        english = str(row.get("english", ""))
        ipa_pron = str(row.get("pronunciation", "")).strip()
        cleaned_word = clean_filename(english)
        if not cleaned_word:
            continue

        audio_name = f"{cleaned_word}{suffix}"
        extension_word = add_extension(audio_name)
        audio_names.append(extension_word)

        audio_path = os.path.join(audio_folder, extension_word)
        if os.path.exists(audio_path):
            print(f"Skipping (audio already exists): {audio_path}")
            continue

        if not ipa_pron:
            print(f"Skipping (missing IPA): {english}")
            continue

        try:
            ssml = (
                "<speak><phoneme alphabet=\"ipa\" ph=\""
                + html.escape(ipa_pron, quote=True)
                + "\">"
                + html.escape(english)
                + "</phoneme></speak>"
            )
            synthesis_input = texttospeech.SynthesisInput(ssml=ssml)

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
            print(f"Queued IPA audio generation with Google Cloud: {extension_word}")
        except Exception as e:
            print(f"Error generating IPA audio for word '{english}' (IPA '{ipa_pron}'): {e}")

    await asyncio.gather(*audio_tasks)
    df["audio"] = audio_names
    return df

# Function to save audio asynchronously
async def async_save_audio(tts, filename):
    await asyncio.to_thread(tts.save, filename)


