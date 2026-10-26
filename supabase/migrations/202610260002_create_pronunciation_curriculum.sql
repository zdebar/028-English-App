BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.items) THEN
    RAISE EXCEPTION 'Clear public.items before applying the pronunciation curriculum migration';
  END IF;

  IF EXISTS (SELECT 1 FROM public.lessons) THEN
    RAISE EXCEPTION 'Clear public.lessons before applying the pronunciation curriculum migration';
  END IF;

  IF EXISTS (SELECT 1 FROM public.groups) THEN
    RAISE EXCEPTION 'Clear public.groups before applying the pronunciation curriculum migration';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.levels WHERE name = 'A1' AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'The A1 level is required before applying the pronunciation curriculum migration';
  END IF;
END;
$$;

CREATE TEMP TABLE curriculum_lessons (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO curriculum_lessons(id, name, sort_order) VALUES
  (1, 'Hláska p', 1),
  (2, 'Hláska t', 2),
  (3, 'Hláska k', 3),
  (4, 'Hláska b', 4),
  (5, 'Hláska d', 5),
  (6, 'Hláska ɡ', 6),
  (7, 'Hláska f', 7),
  (8, 'Hláska v', 8),
  (9, 'Hláska w', 9),
  (10, 'Hláska θ', 10),
  (11, 'Hláska ð', 11),
  (12, 'Hláska h', 12),
  (13, 'Hláska m', 13),
  (14, 'Hláska n', 14),
  (15, 'Hláska ŋ', 15),
  (16, 'Hláska l', 16),
  (17, 'Hláska ɹ', 17),
  (18, 'Hláska j', 18),
  (19, 'Hláska s', 19),
  (20, 'Hláska z', 20),
  (21, 'Hláska ʃ', 21),
  (22, 'Hláska ʒ', 22),
  (23, 'Hláska tʃ', 23),
  (24, 'Hláska dʒ', 24),
  (25, 'Hláska i', 25),
  (26, 'Hláska ɪ', 26),
  (27, 'Hláska u', 27),
  (28, 'Hláska ʊ', 28),
  (29, 'Hláska ɛ', 29),
  (30, 'Hláska æ', 30),
  (31, 'Hláska ɑ', 31),
  (32, 'Hláska ʌ', 32),
  (33, 'Hláska ɔ', 33),
  (34, 'Hláska ə', 34),
  (35, 'Hláska ɝ', 35),
  (36, 'Hláska ɚ', 36),
  (37, 'Hláska eɪ', 37),
  (38, 'Hláska aɪ', 38),
  (39, 'Hláska aʊ', 39),
  (40, 'Hláska oʊ', 40),
  (41, 'Hláska ɔɪ', 41),
  (42, 'Osobní zájmena', 42),
  (43, 'Být - základní tvary', 43),
  (44, 'Být - zkrácené tvary', 44);

INSERT INTO public.lessons(id, name, note, level_id, group_id, sort_order)
SELECT curriculum_lessons.id,
  curriculum_lessons.name,
  NULL,
  level.id,
  NULL,
  curriculum_lessons.sort_order
FROM curriculum_lessons
CROSS JOIN public.levels level
WHERE level.name = 'A1'
  AND level.deleted_at IS NULL;

-- The preparation scripts use each CSV filename prefix as its lesson_id.
SELECT setval(
  pg_get_serial_sequence('public.lessons', 'id'),
  (SELECT MAX(id) FROM public.lessons),
  TRUE
);

CREATE TEMP TABLE curriculum_sounds (
  name TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO curriculum_sounds(name, sort_order) VALUES
  ('p', 1),
  ('t', 2),
  ('k', 3),
  ('b', 4),
  ('d', 5),
  ('ɡ', 6),
  ('f', 7),
  ('v', 8),
  ('w', 9),
  ('θ', 10),
  ('ð', 11),
  ('h', 12),
  ('m', 13),
  ('n', 14),
  ('ŋ', 15),
  ('l', 16),
  ('ɹ', 17),
  ('j', 18),
  ('s', 19),
  ('z', 20),
  ('ʃ', 21),
  ('ʒ', 22),
  ('tʃ', 23),
  ('dʒ', 24),
  ('i', 25),
  ('ɪ', 26),
  ('u', 27),
  ('ʊ', 28),
  ('ɛ', 29),
  ('æ', 30),
  ('ɑ', 31),
  ('ʌ', 32),
  ('ɔ', 33),
  ('ə', 34),
  ('ɝ', 35),
  ('ɚ', 36),
  ('eɪ', 37),
  ('aɪ', 38),
  ('aʊ', 39),
  ('oʊ', 40),
  ('ɔɪ', 41);

INSERT INTO public.groups(id, type, name, note, sort_order)
SELECT sound.sort_order, 'sound', sound.name, NULL, sound.sort_order
FROM curriculum_sounds sound;

UPDATE public.lessons lesson
SET group_id = sound.sort_order
FROM curriculum_sounds sound
WHERE lesson.id = sound.sort_order;

SELECT setval(
  pg_get_serial_sequence('public.groups', 'id'),
  (SELECT MAX(id) FROM public.groups),
  TRUE
);

COMMIT;
