BEGIN;

ALTER TABLE public.groups
  ADD COLUMN sound_class TEXT,
  ADD COLUMN sound_category TEXT;

UPDATE public.groups
SET
  sound_class = CASE
    WHEN name IN ('ɪ', 'ɛ', 'æ', 'ʊ', 'ʌ', 'ə', 'ɚ',
      'i', 'u', 'ɑ', 'ɔ', 'ɝ', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ') THEN 'vowel'
    WHEN name IN ('p', 't', 'k', 'f', 'θ', 's', 'ʃ', 'tʃ', 'h',
      'b', 'd', 'ɡ', 'v', 'ð', 'z', 'ʒ', 'dʒ', 'm', 'n', 'ŋ', 'w', 'j', 'ɹ', 'l') THEN 'consonant'
    ELSE NULL
  END,
  sound_category = CASE
    WHEN name IN ('ɪ', 'ɛ', 'æ', 'ʊ', 'ʌ', 'ə', 'ɚ') THEN 'short_vowel'
    WHEN name IN ('i', 'u', 'ɑ', 'ɔ', 'ɝ') THEN 'long_vowel'
    WHEN name IN ('eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ') THEN 'diphthong'
    WHEN name IN ('p', 't', 'k', 'f', 'θ', 's', 'ʃ', 'tʃ', 'h') THEN 'voiceless_consonant'
    WHEN name IN ('b', 'd', 'ɡ', 'v', 'ð', 'z', 'ʒ', 'dʒ') THEN 'voiced_consonant'
    WHEN name IN ('m', 'n', 'ŋ', 'w', 'j', 'ɹ', 'l') THEN 'other_consonant'
    ELSE NULL
  END,
  updated_at = NOW()
WHERE type = 'sound'
  AND deleted_at IS NULL;

ALTER TABLE public.groups
  ADD CONSTRAINT groups_sound_classification_presence_check CHECK (
    (sound_class IS NULL) = (sound_category IS NULL)
  ),
  ADD CONSTRAINT groups_sound_classification_type_check CHECK (
    (type = 'sound' AND deleted_at IS NULL) = (sound_class IS NOT NULL)
  ),
  ADD CONSTRAINT groups_sound_classification_pair_check CHECK (
    (sound_class = 'vowel' AND sound_category IN ('short_vowel', 'long_vowel', 'diphthong'))
    OR (
      sound_class = 'consonant'
      AND sound_category IN ('voiceless_consonant', 'voiced_consonant', 'other_consonant')
    )
    OR (sound_class IS NULL AND sound_category IS NULL)
  );

COMMIT;

