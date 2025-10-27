-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,  
  uid TEXT UNIQUE NOT NULL, -- public user identifier
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- hashed password
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grammar table
CREATE TABLE IF NOT EXISTS grammar (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, 
  note TEXT NOT NULL
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, 
  sequence INTEGER CHECK (sequence >= 0),
  grammar_id INTEGER, -- null means vocabulary item
  FOREIGN KEY (grammar_id) REFERENCES grammar(id) ON DELETE SET NULL
);

-- Items table
CREATE TABLE IF NOT EXISTS items (  
  id SERIAL PRIMARY KEY,
  czech TEXT NOT NULL, 
  english TEXT NOT NULL, 
  pronunciation TEXT, -- IPA phonetic transcription
  audio TEXT, -- audio file name, without extension
  sequence INTEGER CHECK (sequence >= 0), -- item's order inside the block
  block_id INTEGER,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE SET NULL
);

-- User items table
CREATE TABLE IF NOT EXISTS user_items (
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  next_at TIMESTAMP, 
  learned_at TIMESTAMP, 
  mastered_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, item_id)
);

-- User score table
CREATE TABLE IF NOT EXISTS user_score (
  user_id INTEGER NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  item_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, date)
);

-- Trigger to manage user_score
CREATE OR REPLACE FUNCTION update_user_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the user_score table
  INSERT INTO user_score (user_id, date, item_count)
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) DO UPDATE
  SET item_count = user_score.item_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_score
AFTER UPDATE ON user_items
FOR EACH ROW
EXECUTE FUNCTION update_user_score();