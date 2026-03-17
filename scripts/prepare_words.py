import sys
import os
from datetime import datetime
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scripts.utils.preparation import read_vocab_csv, clean_DataFrame, redo_Id, redo_sort_order
from scripts.utils.pronunciation import fill_pronunciation_espeak_ng
from scripts.utils.audio import generate_audio_with_google_cloud

async def prepare_words(file_name: str, output_file: str, audio_folder: str, suffix: str) -> None:
	# 1. Read data
	df = read_vocab_csv(file_name)
	if df is None:
		print("Error: DataFrame is None after reading CSV.")
		return
	# 2. Clean data
	df = clean_DataFrame(df)
	# 3. Fill IPA pronunciation	
	df = await fill_pronunciation_espeak_ng(df)
	# 4. Redo IDs and sort order
	df = redo_Id(df)
	df = redo_sort_order(df)
	# 5. Generate audio files
	df = await generate_audio_with_google_cloud(df, audio_folder, suffix)
	# 6. Save final result with updated audio paths
	df.to_csv(output_file, index=False)
	print(f"Processed and saved: {output_file}")

async def prepare_words_in_folder(data_dir: str, audio_folder: str) -> None:
	suffix = f"_{datetime.now().strftime('%Y%m%d')}"
	input_files = []

	for entry in sorted(os.listdir(data_dir)):
		file_path = os.path.join(data_dir, entry)
		if not os.path.isfile(file_path):
			continue
		if not entry.lower().endswith(".csv"):
			continue
		if os.path.splitext(entry)[0].endswith(suffix):
			continue
		input_files.append(file_path)

	if not input_files:
		print(f"No input CSV files found in: {data_dir}")
		return

	for file_path in input_files:
		base_name, extension = os.path.splitext(os.path.basename(file_path))
		output_file = os.path.join(data_dir, f"{base_name}{suffix}{extension}")
		await prepare_words(file_path, output_file, audio_folder, suffix)

# Runner
if __name__ == "__main__":
	import asyncio
	data_dir = os.path.join(os.path.dirname(__file__), "data/prepare")
	audio_folder = os.path.join(data_dir, "audio")

	# Ensure output and audio/opus folders exist
	os.makedirs(data_dir, exist_ok=True)
	os.makedirs(audio_folder, exist_ok=True)

	asyncio.run(prepare_words_in_folder(data_dir, audio_folder))

# Guide
