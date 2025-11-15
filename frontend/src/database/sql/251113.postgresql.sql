-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY, -- Matches the id from Supabase auth.users
  username TEXT UNIQUE, -- Optional: Custom username for your app
  settings JSONB DEFAULT '{}', -- Store user settings as JSON
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP DEFAULT NULL -- Soft delete column
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
  started_at TIMESTAMP NOT NULL DEFAULT NOW(), 
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(), 
  deleted_at TIMESTAMP,
  next_at TIMESTAMP, 
  learned_at TIMESTAMP,
  mastered_at TIMESTAMP,
  PRIMARY KEY (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- User score table
CREATE TABLE IF NOT EXISTS user_score (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
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
$$ LANGUAGE plpgsql;

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

-- Indexes on updated_at columns
CREATE INDEX idx_items_updated_at ON items(updated_at);
CREATE INDEX idx_user_items_updated_at ON user_items(updated_at);
CREATE INDEX idx_user_score_updated_at ON user_score(updated_at);

