-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Grammar table
CREATE TABLE IF NOT EXISTS grammar (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, 
  note TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Levels table
CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  name TEXT, 
  level_id INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL
);

-- Items table
CREATE TABLE IF NOT EXISTS items (  
  id SERIAL PRIMARY KEY,
  czech TEXT NOT NULL, 
  english TEXT NOT NULL, 
  pronunciation TEXT, -- IPA phonetic transcription
  audio TEXT, -- audio file name, without extension
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  grammar_id INTEGER, 
  lesson_id INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  FOREIGN KEY (grammar_id) REFERENCES grammar(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

-- User items table
CREATE TABLE IF NOT EXISTS user_items (
  user_id UUID NOT NULL,
  item_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  started_at TIMESTAMPTZ DEFAULT NOW(), 
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
  next_at TIMESTAMPTZ, 
  mastered_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);

-- User score table
CREATE TABLE IF NOT EXISTS user_scores (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path TO public;

-- Trigger for grammar table
CREATE TRIGGER set_updated_at_grammar
BEFORE UPDATE ON grammar
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for levels table
CREATE TRIGGER set_updated_at_levels
BEFORE UPDATE ON levels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lessons table
CREATE TRIGGER set_updated_at_lessons
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for items table
CREATE TRIGGER set_updated_at_items
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_items table
CREATE TRIGGER set_updated_at_user_items
BEFORE UPDATE ON user_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_score table
CREATE TRIGGER set_updated_at_user_scores
BEFORE UPDATE ON user_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger on auth.users to create entry in public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Trigger on soft delete user
CREATE OR REPLACE FUNCTION public.restore_user_on_signin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET deleted_at = NULL
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;

CREATE TRIGGER on_auth_user_signin
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.restore_user_on_signin();

-- Indexes on updated_at columns
CREATE INDEX idx_items_updated_at ON items(updated_at);
CREATE INDEX idx_user_items_updated_at ON user_items(updated_at); 
CREATE INDEX idx_user_scores_updated_at ON user_scores(updated_at);

CREATE INDEX idx_user_scores_user_id_updated_at ON user_scores (user_id, updated_at);
CREATE INDEX idx_items_sequence ON public.items (sequence);
CREATE INDEX idx_user_items_user_updated ON public.user_items (user_id, updated_at) 
INCLUDE (item_id, progress, started_at, updated_at, next_at, mastered_at);
CREATE INDEX idx_items_updated_sequence ON public.items (updated_at, sequence) 
INCLUDE (id, czech, english, pronunciation, audio, grammar_id, deleted_at);

