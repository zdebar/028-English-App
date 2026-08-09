# Vocabulary data workflow

This folder holds the CSV files used to prepare vocabulary lessons and to
maintain the word lists. Run the scripts from the repository root:

```powershell
python scripts/prepare_words.py
python scripts/trim_audio.py
python scripts/mark_words.py
```

## Normal workflow

1. Add or edit a lesson source CSV in `prepare/`. Give it a leading lesson
   number, for example `05_plurals.csv`.
2. Run `python scripts/prepare_words.py`.
3. Optionally adjust the constants in `scripts/trim_audio.py`, then run
   `python scripts/trim_audio.py` to write trimmed copies to `prepare/audio_trim/`.
   The original files in `prepare/audio/` are preserved.
4. Review the newly created timestamped CSV and the trimmed audio files in
   `prepare/audio_trim/`. Use the timestamped CSV as the prepared result.
5. Only when the lesson's words should count as used, run
   `python scripts/mark_words.py`.

`mark_words.py` is **not** run by `prepare_words.py`. They are independent
commands. However, marking reads its source words directly from every CSV in
`scripts/data/prepare/`, so the preparation folder is the hand-off between the
two scripts.

## Folders and files

| Path                                                     | Purpose                                                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `prepare/`                                               | Input lesson CSVs and their dated prepared outputs. This is the only data folder used by `prepare_words.py` and `mark_words.py`. |
| `prepare/audio/`                                         | Generated Google Cloud Text-to-Speech audio in Ogg Opus format.                                                                  |
| `tracker/already_used.csv`                               | Permanent record of Czech/English pairs already selected. Maintained by `mark_words.py`.                                         |
| `tracker/10k_words.csv`, `1k_words.csv`, `200_words.csv` | Candidate word lists. `mark_words.py` removes words selected in `prepare/` from these files.                                     |
| `backup/`                                                | Copies of the candidate word lists; no current Python script reads this folder.                                                  |
| `ready/`                                                 | Prepared lesson CSV collection; no current Python script reads this folder.                                                      |
| `temp/`                                                  | Working copies of candidate lists and helper files; no current Python script reads this folder.                                  |
| `before/`                                                | Empty staging folder at present; no current Python script reads this folder.                                                     |

## Lesson CSV format

At minimum, source files need `czech` and `english` columns. Optional fields
such as `grammar_chunk_id`, `block_id`, and `note_id` are preserved. A typical source
file starts like this:

```csv
czech,english,grammar_chunk_id,block_id,note_id
já,I,,1,
ty,you,,1,
```

`prepare_words.py` normalizes the file to this column set (when applicable):

```text
id, czech, english, pronunciation, audio, sort_order, grammar_chunk_id,
lesson_id, block_id, note_id
```

It does not create `id` when the source file has no `id` column. It assigns:

- `lesson_id` from the leading number in the filename (`05_plurals.csv` → `5`);
- `sort_order` starting at `lesson_id * 1000` (`5000`, `5001`, ...);
- IPA pronunciation through locally installed eSpeak NG (`en-us`);
- an `.opus` audio filename and, when missing, the matching Google Cloud TTS
  audio file.

The generated output is saved beside the input using one UTC timestamp for the
whole run, such as `05_plurals_20260715T132045Z.csv`.

## Requirements for preparation

- Python dependencies used by the scripts, including `pandas`,
  `google-cloud-texttospeech`, `python-dotenv`, FFmpeg, and eSpeak NG.
- eSpeak NG installed at `C:/Program Files/eSpeak NG/espeak-ng.exe`.
- `GOOGLE_APPLICATION_CREDENTIALS` configured in `.env` for Google Cloud TTS.
- Optional voice tuning in `.env`: `GCP_TTS_VOICE_NAME`,
  `GCP_TTS_IPA_VOICE_NAME`, `GCP_TTS_SPEAKING_RATE`, and `GCP_TTS_PITCH`.

Audio filenames are stable by default: `Good morning!` becomes
`good_morning.opus`. Set `include_audio_timestamp=True` when calling either
folder preparation function to append the UTC timestamp, for example
`good_morning_20260715T132045Z.opus`. Output CSV filenames remain timestamped
to keep each preparation run separate.

## What marking does

`mark_words.py` first reads **all** CSV files in `prepare/`, then:

1. Adds new selected pairs to `tracker/already_used.csv`.
2. Reports source rows already present in that tracker.
3. Removes matching words from the three candidate lists in `tracker/`.

Matching ignores leading/trailing whitespace and letter case. When the source
row contains both `czech` and `english`, both values must match. A source row
without Czech text matches by English text alone.

This operation rewrites the tracker candidate CSVs and appends to
`already_used.csv`; make a backup or commit before running it if you may need
to undo the selection.

## Generated output files

Both preparation scripts ignore CSVs ending in either the legacy `_YYYYMMDD`
suffix or the current `_YYYYMMDDTHHMMSSZ` suffix, so generated outputs are not
processed again on later runs. Move the prepared CSV you intend to use into the
appropriate hand-off location as usual. Note that `mark_words.py` still reads
every CSV in `prepare/`, including generated outputs.

## Related scripts

- `scripts/prepare_audio_from_IPA.py` follows the same folder/timestamp convention,
  but generates TTS from the IPA value in the `pronunciation` column using the
  US English Neural2 voice. IPA may be written as `lɪv` or `/lɪv/`; surrounding
  slashes are removed before creating the SSML phoneme. The script replaces
  same-named audio files so an existing English-based recording cannot prevent
  IPA-guided synthesis.
- `scripts/convert_grammar.py` converts `note`/`NOTE` HTML in a grammar CSV to
  `dl.grammar-pairs` HTML. It is unrelated to the vocabulary preparation and
  marking workflow.
