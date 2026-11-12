# eSpeak NG: IPA for American English (`en-us`)

**Verified on:** 2026-10-26  
**Verified local version:** eSpeak NG 1.52.0  
**Command used:** `espeak-ng -q --ipa -v en-us <word>`

## How eSpeak generates transcriptions

The project's word preparation passes English text to eSpeak NG using the `en-us` voice
and the `--ipa` option. eSpeak selects a pronunciation based on its English dictionary
and letter-to-sound rules, then writes it using Unicode IPA symbols. The transcription
contains the selected pronunciation of a specific word, not just a list of its
underlying phonemes.

Plain `--ipa` uses standard IPA output. eSpeak NG also offers the `--ipa=1`,
`--ipa=2`, and `--ipa=3` variants, which change how multi-character sounds are
separated or joined. The `-q` option suppresses audio output; the text transcription
remains on standard output.

The `en-us` voice is labeled **General American** in the eSpeak NG documentation.
English vowels are described using John Wells's lexical sets. These name groups of
words with the same type of vowel, such as KIT (*sit*), FLEECE (*see*), or NURSE (*bird*).

Sources: [eSpeak NG transcription modes](https://github.com/espeak-ng/espeak-ng/blob/master/docs/phonemes.md),
[documentation on English accents and vowel sets](https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages/gmw/en.md),
[phoneme definitions for American English](https://github.com/espeak-ng/espeak-ng/blob/master/phsource/ph_english_us)
and [English dictionary rules](https://github.com/espeak-ng/espeak-ng/blob/master/docs/dictionary.md).

## Main consonants

The basic consonant phonemes of General American can be transcribed as follows:

| Category | IPA |
| --- | --- |
| Plosives | `p b t d k ɡ` |
| Affricates | `tʃ dʒ` |
| Fricatives | `f v θ ð s z ʃ ʒ h` |
| Nasals | `m n ŋ` |
| Approximants and liquids | `l ɹ j w` |

These are **24 basic consonant phonemes**. In some positions, /t/ is pronounced as a
short alveolar flap `ɾ`, for example in *city* or *water*. This is a contextual
pronunciation variant, not another basic consonant phoneme. The eSpeak NG rules for
American English write it directly as `ɾ`.

## Vowel sets

The following table shows IPA forms documented for General American, along with
common examples:

| Lexical set | Example | IPA in GenAm documentation |
| --- | --- | --- |
| KIT | *sit* | `ɪ` |
| DRESS | *bed* | `ɛ` |
| TRAP | *bad* | `æ` |
| LOT | *hot* | `ɑ` |
| STRUT | *cup* | `ʌ` |
| FOOT | *book* | `ʊ` |
| FLEECE | *see* | `i` |
| PALM | *father* | `ɑ` |
| THOUGHT | *thought* | `ɔ` |
| GOOSE | *food* | `u` |
| NURSE / BIRD | *bird* | `ɝ` |
| LETTER | *teacher* | `ɚ` |
| COMMA | *about* | `ə` |
| FACE | *day* | `eɪ` |
| PRICE | *my* | `aɪ` |
| CHOICE | *boy* | `ɔɪ` |
| MOUTH | *now* | `aʊ` |
| GOAT | *go* | `oʊ` |

The vowel system can vary by speaker and region. For example, /ɔ/ in words such as
*thought* merges with /ɑ/ for speakers with the *cot–caught merger*.

## Symbols and other sounds in the output

| Symbol | Meaning | Example from local version 1.52.0 |
| --- | --- | --- |
| `ˈ` | Primary stress on the following syllable | *see* → `sˈiː` |
| `ˌ` | Secondary stress | May appear in multisyllabic words |
| `ː` | Vowel length | *food* → `fˈuːd` |
| `ɾ` | Short flap in place of /t/ in some positions | *city* → `sˈɪɾi` |
| `ɚ` | Unstressed rhotic vowel | *teacher* → `tˈiːtʃɚ` |
| `ɐ` | Reduced vowel | *about* → `ɐbˈaʊt` |
| `ʔ` | Glottal stop | *button* → `bˈʌʔn̩` |
| `◌̩` | Syllabic consonant marker | *button* → final `n̩` |

Direct checks with local version 1.52.0 produced the following transcriptions, for example:

| Word | `--ipa -v en-us` output |
| --- | --- |
| *see* | `sˈiː` |
| *chair* | `tʃˈɛɹ` |
| *water* | `wˈɔːɾɚ` |
| *about* | `ɐbˈaʊt` |
| *button* | `bˈʌʔn̩` |

The exact output depends on the eSpeak NG version and its dictionary. For example,
version 1.52.0 returns `bˈɜːd` for *bird*. To check a specific installation, run
`espeak-ng --version`, then run the command shown above.

## Use in the project

The `fill_pronunciation_espeak_ng` function in `scripts/utils/pronunciation.py`
accepts an accent argument (default `en-us`), removes commas from the input,
and saves the trimmed standard output text in the `pronunciation` column. For English
voices, it also normalizes `ɐ` to `ə`. Therefore, the stored value may differ in this
character from the direct output of the eSpeak command shown above. Word preparation
uses this function with `en-gb` in `scripts/01_prepare_data.py` to align IPA with the
British voice used by `scripts/02_generate_audio.py`.

Verified command in PowerShell:

```powershell
& 'C:\Program Files\eSpeak NG\espeak-ng.exe' -q --ipa -v en-us water
```

The project does not pin the eSpeak NG version in its Python dependencies. The date
and specific examples above therefore describe the local version verified on 2026-10-26.
