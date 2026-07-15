
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
  history_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS grammar (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,  
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
  is_vocabulary BOOLEAN NOT NULL,
  show_in_topics BOOLEAN NOT NULL DEFAULT TRUE,
  is_practice_block BOOLEAN NOT NULL DEFAULT TRUE,
  grammar_id INTEGER REFERENCES grammar(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT blocks_vocabulary_grammar_check CHECK (
    (is_vocabulary = TRUE AND grammar_id IS NULL)
    OR (is_vocabulary = FALSE AND grammar_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS user_blocks (
  block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  PRIMARY KEY (block_id, user_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  czech TEXT NOT NULL,
  english TEXT NOT NULL,
  pronunciation TEXT,
  audio TEXT,
  note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 0), 
  block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS user_items_history (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL CHECK (progress >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id, created_at)
);

CREATE TABLE IF NOT EXISTS user_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, date)
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
CREATE INDEX IF NOT EXISTS idx_lessons_level_id ON public.lessons (level_id);
CREATE INDEX IF NOT EXISTS idx_blocks_lesson_vocabulary_sort
  ON public.blocks (lesson_id, is_vocabulary, sort_order);
CREATE INDEX IF NOT EXISTS idx_blocks_grammar_id ON public.blocks (grammar_id);
CREATE INDEX IF NOT EXISTS idx_items_note_id ON public.items (note_id);
CREATE INDEX IF NOT EXISTS idx_items_block_id ON public.items (block_id);

CREATE INDEX IF NOT EXISTS idx_user_items_user_updated_item
  ON public.user_items (user_id, updated_at, item_id)
  INCLUDE (progress, started_at, next_at, mastered_at);

CREATE INDEX IF NOT EXISTS idx_user_items_item_user
  ON public.user_items (item_id, user_id)
  INCLUDE (progress, started_at, updated_at, next_at, mastered_at);

CREATE INDEX IF NOT EXISTS idx_user_items_history_item_id
  ON public.user_items_history (item_id);

CREATE INDEX IF NOT EXISTS idx_user_scores_user_updated_date
  ON public.user_scores (user_id, updated_at, date)
  INCLUDE (item_count, deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_blocks_user_updated_block
  ON public.user_blocks (user_id, updated_at, block_id)
  INCLUDE (progress, started_at, next_at, mastered_at);

CREATE INDEX IF NOT EXISTS idx_user_blocks_user_block
  ON public.user_blocks (user_id, block_id);
