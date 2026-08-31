
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS grammar_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT grammar_groups_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS grammar_chunks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  grammar_group_id INTEGER NOT NULL REFERENCES grammar_groups(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT grammar_chunks_group_name_key
    UNIQUE (grammar_group_id, name),
  CONSTRAINT grammar_chunks_sort_order_key
    UNIQUE (grammar_group_id, sort_order) DEFERRABLE INITIALLY DEFERRED
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

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT lessons_level_sort_order_key
    UNIQUE (level_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  grammar_chunk_id INTEGER REFERENCES grammar_chunks(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT blocks_id_lesson_id_key UNIQUE (id, lesson_id)
);

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT topics_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

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
  english TEXT NOT NULL,
  pronunciation TEXT,
  audio TEXT,
  note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
  grammar_chunk_id INTEGER REFERENCES grammar_chunks(id) ON DELETE RESTRICT,
  is_vocabulary BOOLEAN NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  block_id INTEGER,
  topic_id INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT items_lesson_sort_order_key
    UNIQUE (lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT items_block_lesson_fkey
    FOREIGN KEY (block_id, lesson_id)
    REFERENCES blocks(id, lesson_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS pronunciation_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT pronunciation_groups_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS pronunciation_group_items (
  pronunciation_group_id INTEGER NOT NULL
    REFERENCES pronunciation_groups(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  contrast_set INTEGER CHECK (contrast_set >= 1),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (pronunciation_group_id, item_id),
  CONSTRAINT pronunciation_group_items_group_sort_order_key
    UNIQUE (pronunciation_group_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS grammar_chunk_examples (
  grammar_chunk_id INTEGER NOT NULL
    REFERENCES grammar_chunks(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (grammar_chunk_id, item_id),
  CONSTRAINT grammar_chunk_examples_chunk_sort_order_key
    UNIQUE (grammar_chunk_id, sort_order) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  progress_cz_to_en INTEGER NOT NULL DEFAULT 0 CHECK (progress_cz_to_en >= 0),
  progress_en_to_cz INTEGER NOT NULL DEFAULT 0 CHECK (progress_en_to_cz >= 0),
  has_pronunciation_practice BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS user_item_progress_history (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('czToEn', 'enToCz')),
  progress INTEGER NOT NULL CHECK (progress >= 0),
  max_progress INTEGER NOT NULL CHECK (max_progress >= 0),
  progress_change INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, date, item_id, direction)
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
CREATE INDEX IF NOT EXISTS idx_blocks_grammar_chunk_id ON public.blocks (grammar_chunk_id);
CREATE INDEX IF NOT EXISTS idx_items_note_id ON public.items (note_id);
CREATE INDEX IF NOT EXISTS idx_items_block_id ON public.items (block_id);
CREATE INDEX IF NOT EXISTS idx_items_topic_id ON public.items (topic_id);
CREATE INDEX IF NOT EXISTS idx_items_grammar_chunk_id ON public.items (grammar_chunk_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_group_items_item_id
  ON public.pronunciation_group_items (item_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_group_items_group_contrast_sort
  ON public.pronunciation_group_items (pronunciation_group_id, contrast_set, sort_order);
CREATE INDEX IF NOT EXISTS idx_grammar_chunk_examples_item_id
  ON public.grammar_chunk_examples (item_id);

CREATE INDEX IF NOT EXISTS idx_user_items_user_updated_item
  ON public.user_items (user_id, updated_at, item_id)
  INCLUDE (
    progress_cz_to_en,
    progress_en_to_cz,
    started_at,
    next_at_cz_to_en,
    next_at_en_to_cz,
    mastered_at_cz_to_en,
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
    next_at_en_to_cz,
    mastered_at_cz_to_en,
    mastered_at_en_to_cz
  );

CREATE INDEX IF NOT EXISTS idx_user_items_user_pronunciation_practice
  ON public.user_items (user_id, has_pronunciation_practice);

CREATE INDEX IF NOT EXISTS idx_user_item_progress_history_user_updated
  ON public.user_item_progress_history (user_id, updated_at, date);
