import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pandas as pd
from scripts.utils.preparation import read_vocab_csv, clean_DataFrame
from scripts.utils.pronunciation import fill_pronunciation_espeak_ng
from scripts.utils.audio import generate_audio_with_google_cloud

async def prepare_words(file_name: str, output_file: str, audio_folder: str, opus_folder: str) -> None:
	# 1. Read data
	df = read_vocab_csv(file_name)
	if df is None:
		print("Error: DataFrame is None after reading CSV.")
		return
	# 2. Clean data
	df = clean_DataFrame(df)
	# 3. Fill IPA pronunciation	
	df = await fill_pronunciation_espeak_ng(df)
	# 4. Generate audio files
	df = await generate_audio_with_google_cloud(df, audio_folder, "_20260313")
	# 5. Save final result with updated audio paths
	df.to_csv(output_file, index=False)
	print(f"Processed and saved: {output_file}")

# Runner
if __name__ == "__main__":
	import asyncio
	data_dir = os.path.join(os.path.dirname(__file__), "data")
	file_name = os.path.join(data_dir, "input.csv")
	output_file = os.path.join(data_dir, "output.csv")
	audio_folder = os.path.join(data_dir, "audio")
	opus_folder = os.path.join(data_dir, "opus")

	# Ensure output and audio/opus folders exist
	os.makedirs(os.path.dirname(output_file), exist_ok=True)
	os.makedirs(audio_folder, exist_ok=True)
	os.makedirs(opus_folder, exist_ok=True)

	asyncio.run(prepare_words(file_name, output_file, audio_folder, opus_folder))