# Content preparation scripts

The Python scripts under **scripts/** prepare vocabulary CSVs and audio files. They do not import rows into Supabase. Run commands from the repository root.

## Vocabulary workflow

1. Put source CSV files in **scripts/data/prepare/**. Filenames start with the lesson number, such as **05_plurals.csv**. The scripts create the folder if it does not exist.
2. Run **python scripts/01_prepare_data.py** to normalize the selected columns, fill missing vocabulary flags, derive lesson and sort order from the filename, and generate British English IPA with eSpeak NG. It writes a timestamped CSV beside each source file and does not generate audio.
3. Review or edit the IPA in the timestamped CSV output.
4. Run **python scripts/02_generate_audio.py** to generate audio from the `english` column using `en-US-Neural2-F`. Pass **--ipa** to generate from the `pronunciation` column instead. Both modes fill the `audio` column in the timestamped CSVs and save recordings under **scripts/data/prepare/audio/**.
5. Optionally run **python scripts/trim_audio.py**. It reads audio from **scripts/data/prepare/audio/** and writes trimmed copies to **scripts/data/prepare/audio_trim/** without replacing the originals.
6. Only after choosing which words should be marked as used, run **python scripts/mark_words.py**.

The first script ignores timestamped CSVs, so it will not prepare its own outputs again. The second script processes timestamped CSVs produced by the first script and updates them in place.

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
