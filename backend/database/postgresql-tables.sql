SET search_path TO public;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS grammar (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,  
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  note TEXT,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  czech TEXT NOT NULL,
  english TEXT NOT NULL,
  pronunciation TEXT,
  audio TEXT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 0),
  grammar_id INTEGER REFERENCES grammar(id) ON DELETE SET NULL,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE RESTRICT,
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- CREATE optimalization indexes
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON public.items (updated_at);
CREATE INDEX IF NOT EXISTS idx_user_items_updated_at ON public.user_items (updated_at);
CREATE INDEX IF NOT EXISTS idx_user_scores_updated_at ON public.user_scores (updated_at);
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id_updated_at ON public.user_scores (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_items_sort_order ON public.items (sort_order);
CREATE INDEX IF NOT EXISTS idx_levels_sort_order ON public.levels (sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_level_sort_order ON public.lessons (level_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_user_items_user_updated ON public.user_items (user_id, updated_at)
INCLUDE (item_id, progress, started_at, next_at, mastered_at);
CREATE INDEX IF NOT EXISTS idx_items_updated_sort_order ON public.items (updated_at, sort_order)
INCLUDE (id, czech, english, pronunciation, audio, grammar_id, lesson_id, deleted_at);

