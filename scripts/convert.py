import os
from pydub import AudioSegment  
from pydub.silence import detect_nonsilent
from typing import Union, List, Any
import pandas as pd

# This script converts MP3 files to Opus format with a lower bitrate. Also trims silence from the beginning and end of the audio files.

output_format = "opus"

# Function to convert MP3 to Opus with a lower bitrate
def convert_mp3_to_opus(input_path: Union[str, os.PathLike[str]], output_path: Union[str, os.PathLike[str]], bitrate: str = "64k") -> None:
    try:
        audio = AudioSegment.from_mp3(input_path) 

        # Detect and trim silence
        silence_threshold = -50  # dBFS (must be an integer)
        silence_chunk_length = 100  # milliseconds
        non_silent_ranges: List[Any] = detect_nonsilent( 
            audio, min_silence_len=silence_chunk_length, silence_thresh=silence_threshold
        )

        if non_silent_ranges:
            start_trim: int = non_silent_ranges[0][0]
            end_trim: int = non_silent_ranges[-1][1]
            audio = audio[start_trim:end_trim]  # Correct slicing of AudioSegment

        audio.export(output_path, format=output_format, bitrate=bitrate) 
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def convert_all_mp3_to_opus(
    input_folder: str,
    output_folder: str,
    bitrate: str = "16k",
    df: pd.DataFrame | None = None,
) -> pd.DataFrame | None:
    os.makedirs(output_folder, exist_ok=True)
    for filename in os.listdir(input_folder):
        if filename.endswith(".mp3"):
            input_path = os.path.join(input_folder, filename)
            output_filename = os.path.splitext(filename)[0] + "." + output_format
            output_path = os.path.join(output_folder, output_filename)
            if os.path.exists(output_path):
                continue
            convert_mp3_to_opus(input_path, output_path, bitrate=bitrate)
            print(f"Processed {filename} to {output_filename}")

    if df is not None and "audio" in df.columns:
        df["audio"] = df["audio"].astype(str).str.replace(r"\.mp3$", ".opus", regex=True)

    print("All files processed successfully!")
    return df

# Example usage
if __name__ == "__main__":
    input_folder = os.path.abspath("../../data/en-source/audio/mp3/1")
    output_folder = os.path.abspath("../../data/en-source/audio/opus_2")
    bitrate = "16k"
    convert_all_mp3_to_opus(input_folder, output_folder, bitrate)