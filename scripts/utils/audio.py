import asyncio
import re
import unicodedata
import os
from collections.abc import Awaitable
import pandas as pd
from dotenv import load_dotenv
from io import BytesIO
from pydub import AudioSegment
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
        audio_names.append(add_extension(audio_name))
        extension_word = add_extension(audio_name)

        audio_path = os.path.join(audio_folder, extension_word)
        if not os.path.exists(audio_path):
            try:
                synthesis_input = texttospeech.SynthesisInput(text=str(english))

                voice = texttospeech.VoiceSelectionParams(
                    language_code=language_code, 
                    ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
                )

                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.OGG_OPUS
                )

                response = client.synthesize_speech(
                    input=synthesis_input, voice=voice, audio_config=audio_config
                )

                audio_tasks.append(asyncio.to_thread(save_audio, response.audio_content, audio_path))
                print(f"Queued audio generation with Google Cloud: {extension_word}")
            except Exception as e:
                print(f"Error generating audio for word '{english}': {e}")
        # else:
        #     print(f"Skipping (audio already exists): {extension_word}")

    await asyncio.gather(*audio_tasks)
    df["audio"] = audio_names
    return df

# Function to save audio asynchronously
async def async_save_audio(tts, filename):
    await asyncio.to_thread(tts.save, filename)


