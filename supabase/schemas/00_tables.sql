
create schema if not exists private;

CREATE TABLE IF NOT EXISTS private.settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SET search_path TO public;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  max_new_lessons_per_day INTEGER NOT NULL DEFAULT 1 CHECK (max_new_lessons_per_day >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT levels_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('topic', 'grammar', 'sound', 'pronunciation')),
  name TEXT NOT NULL,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  sound_class TEXT,
  sound_category TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT groups_sound_classification_presence_check CHECK (
    (sound_class IS NULL) = (sound_category IS NULL)
  ),
  CONSTRAINT groups_sound_classification_type_check CHECK (
    (type = 'sound' AND deleted_at IS NULL) = (sound_class IS NOT NULL)
  ),
  CONSTRAINT groups_sound_classification_pair_check CHECK (
    (sound_class = 'vowel' AND sound_category IN ('short_vowel', 'long_vowel', 'diphthong'))
    OR (
      sound_class = 'consonant'
      AND sound_category IN ('voiceless_consonant', 'voiced_consonant', 'other_consonant')
    )
    OR (sound_class IS NULL AND sound_category IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE RESTRICT,
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT lessons_level_sort_order_key
    UNIQUE (level_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS user_lessons (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, lesson_id, started_at)
);

CREATE INDEX IF NOT EXISTS idx_user_lessons_user_started_at
  ON public.user_lessons (user_id, started_at);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL,
  sort_order INTEGER CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT notes_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  czech TEXT NOT NULL,
  czech_description TEXT DEFAULT NULL,
  is_cz_to_en_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_en_to_cz_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  english TEXT NOT NULL,
  pronunciation TEXT,
  audio TEXT,
  note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
  is_vocabulary BOOLEAN NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT items_lesson_sort_order_key
    UNIQUE (lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS group_items (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (group_id, item_id),
  CONSTRAINT group_items_group_sort_order_key UNIQUE (group_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS group_relations (
  id SERIAL PRIMARY KEY,
  parent_group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  child_group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('hierarchy', 'detail', 'contrast')),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (parent_group_id, child_group_id),
  CHECK (parent_group_id <> child_group_id),
  CONSTRAINT group_relations_parent_type_order_key UNIQUE (parent_group_id, relation_type, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  progress_cz_to_en INTEGER NOT NULL DEFAULT 0 CHECK (progress_cz_to_en >= 0),
  progress_en_to_cz INTEGER NOT NULL DEFAULT 0 CHECK (progress_en_to_cz >= 0),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ,
  PRIMARY KEY (user_id, item_id)
);

-- CREATE user for new supabase.auth.user
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
-- Revoke EXECUTE permission from all roles so only the trigger can call this function
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- CREATE optimalization indexes
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON public.items (updated_at);
CREATE INDEX IF NOT EXISTS idx_items_lesson_id ON public.items (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_level_id ON public.lessons (level_id);
CREATE INDEX IF NOT EXISTS idx_items_note_id ON public.items (note_id);
CREATE INDEX IF NOT EXISTS idx_groups_type_sort_order ON public.groups (type, sort_order);
CREATE INDEX IF NOT EXISTS idx_group_items_item_id ON public.group_items (item_id);
CREATE INDEX IF NOT EXISTS idx_group_items_group_sort_order ON public.group_items (group_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_group_relations_child_id ON public.group_relations (child_group_id);

CREATE INDEX IF NOT EXISTS idx_user_items_user_updated_item
  ON public.user_items (user_id, updated_at, item_id)
  INCLUDE (
    progress_cz_to_en,
    progress_en_to_cz,
    started_at,
    next_at_cz_to_en,
    mastered_at_cz_to_en,
    next_at_en_to_cz,
    mastered_at_en_to_cz
  );
CREATE INDEX IF NOT EXISTS idx_user_items_item_user
  ON public.user_items (item_id, user_id)
  INCLUDE (
    progress_cz_to_en,
    progress_en_to_cz,
    started_at,
    updated_at,
    next_at_cz_to_en,
    mastered_at_cz_to_en,
    next_at_en_to_cz,
    mastered_at_en_to_cz
  );
