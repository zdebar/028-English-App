import pandas as pd
from scripts.preparation import read_vocab_csv, clean_DataFrame
from scripts.translation import fill_missing_czech
from scripts.pronunciation import fill_pronunciation
from scripts.audio import generate_audio_with_google_cloud
from scripts.convert import convert_all_mp3_to_opus
import os

async def prepare_words(file_name: str, output_file: str, audio_folder: str, opus_folder: str) -> None:
	# 1. Read data
	df = read_vocab_csv(file_name)
	if df is None:
		print("Error: DataFrame is None after reading CSV.")
		return
	# 2. Clean data
	df = clean_DataFrame(df)
	# 3. Fill IPA pronunciation	
	df = await fill_pronunciation(df)
	# 4. Generate audio files
	df = await generate_audio_with_google_cloud(df, audio_folder, "_20260311")
	# 5. Save final result with updated audio paths
	df.to_csv(output_file, index=False)
	print(f"Processed and saved: {output_file}")

# Runner
if __name__ == "__main__":
	import asyncio
	data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
	file_name = os.path.join(data_dir, "input.csv") 
	output_file = os.path.join(data_dir, "output.csv")
	audio_folder = os.path.join(data_dir, "audio")
	opus_folder = os.path.join(data_dir, "opus")
	asyncio.run(prepare_words(file_name, output_file, audio_folder, opus_folder))