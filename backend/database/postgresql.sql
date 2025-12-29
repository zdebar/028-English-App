-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL
);

-- Grammar table
CREATE TABLE IF NOT EXISTS grammar (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, 
  note TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL
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
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (grammar_id) REFERENCES grammar(id) ON DELETE SET NULL
);

-- User items table
CREATE TABLE IF NOT EXISTS user_items (
  user_id UUID NOT NULL,
  item_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  started_at TIMESTAMP DEFAULT NOW(), 
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(), 
  next_at TIMESTAMP, 
  mastered_at TIMESTAMP,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
);

-- User score table
CREATE TABLE IF NOT EXISTS user_scores (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path TO public;

-- Trigger for grammar table
CREATE TRIGGER set_updated_at_grammar
BEFORE UPDATE ON grammar
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
CREATE TRIGGER set_updated_at_user_score
BEFORE UPDATE ON user_score
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function: on new auth user, create row in public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Indexes on updated_at columns
CREATE INDEX idx_items_updated_at ON items(updated_at);
CREATE INDEX idx_user_items_updated_at ON user_items(updated_at); 
CREATE INDEX idx_user_score_updated_at ON user_score(updated_at);

CREATE INDEX idx_user_scores_user_id_updated_at ON user_scores (user_id, updated_at);
CREATE INDEX idx_items_sequence ON public.items (sequence);
CREATE INDEX idx_user_items_user_updated ON public.user_items (user_id, updated_at) 
INCLUDE (item_id, progress, started_at, updated_at, next_at, mastered_at);
CREATE INDEX idx_items_updated_sequence ON public.items (updated_at, sequence) 
INCLUDE (id, czech, english, pronunciation, audio, grammar_id, deleted_at);

