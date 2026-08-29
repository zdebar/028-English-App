import csv
import os

INPUT_FILE = '10k_words.csv'  # Change this to your input file path
OUTPUT_PREFIX = '66_slovíčka_'  # Output file prefix
OUTPUT_DIR = '.'  # Output directory (current directory)

def split_csv(input_file, output_prefix, output_dir, chunk_size=100):
    with open(input_file, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        rows = list(reader)
        total_chunks = (len(rows) + chunk_size - 1) // chunk_size

        for i in range(total_chunks):
            chunk = rows[i*chunk_size:(i+1)*chunk_size]
            output_file = os.path.join(output_dir, f"{output_prefix}{i+17}.csv")
            with open(output_file, 'w', newline='', encoding='utf-8') as outcsv:
                writer = csv.DictWriter(outcsv, fieldnames=['czech', 'english'])
                writer.writeheader()
                writer.writerows(chunk)
            print(f"Wrote {output_file} ({len(chunk)} rows)")

if __name__ == "__main__":
    split_csv(INPUT_FILE, OUTPUT_PREFIX, OUTPUT_DIR)