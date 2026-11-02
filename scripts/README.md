# Content preparation scripts

The Python scripts under **scripts/** prepare vocabulary CSVs and audio files. They do not import rows into Supabase. Run commands from the repository root.

## Vocabulary workflow

1. Put source CSV files in **scripts/data/prepare/**. Filenames start with the lesson number, such as **05_plurals.csv**. The preparation scripts create the folder if it does not exist.
2. Run **python scripts/prepare_words.py** to normalize the selected columns, fill missing vocabulary flags, derive lesson and sort order from the filename, generate eSpeak IPA, and prepare missing US-English audio.
3. Review the timestamped CSV output and the audio files in **scripts/data/prepare/audio/**.
4. Optionally run **python scripts/prepare_audio_from_IPA.py** to regenerate audio using the CSV pronunciation field.
5. Optionally run **python scripts/trim_audio.py**. It reads audio from **scripts/data/prepare/audio/** and writes trimmed copies to **scripts/data/prepare/audio_trim/** without replacing the originals.
6. Only after choosing which words should be marked as used, run **python scripts/mark_words.py**.

The preparation scripts ignore CSV files with a trailing date/timestamp when choosing their inputs. They write a timestamped result beside each source CSV.

## CSV fields

The scripts read these fields when present: id, czech, czech_description, english, pronunciation, audio, sort_order, note_id, and is_vocabulary. Missing supported columns are added. The leading digits in the filename determine lesson_id; sort_order is regenerated starting at lesson_id × 1000. The vocabulary flag defaults to true when missing.

These are preparation-file fields, not a complete database import format. Topic, grammar, sound, and pronunciation memberships are represented by groups and their link tables in Supabase. The scripts do not create those relations.

## Word tracker

**python scripts/mark_words.py** reads every CSV in the prepare folder, including timestamped outputs. It appends selected Czech-English pairs to **scripts/data/tracker/already_used.csv** and filters matching words from **scripts/data/tracker/all_vocabulary.csv**. It may rewrite these tracker files, so inspect the target list and keep a backup before running it.

Matching ignores surrounding whitespace and letter case. When a source CSV has a Czech column, rows match by Czech-English pair; otherwise matching uses English text.

Other files under **scripts/data/backup/** and **scripts/data/temp/** are working or backup data. They are not read by the preparation or marking commands.

## Requirements and related tools

Word preparation uses Python packages for CSV handling and Google Cloud Text-to-Speech, eSpeak NG for IPA, and FFmpeg for audio tools. Google Cloud credentials are read from the environment through the project configuration.

- **scripts/convert_grammar.py** converts grammar-note HTML in a CSV to the app's grammar-pair markup.
- **scripts/utils/** contains shared preparation, pronunciation, translation, conversion, and audio helpers.
- **scripts/tests/** contains Python tests for selected script utilities.

For the current database model and import boundaries, see [../DATA_GUIDE.md](../DATA_GUIDE.md).
