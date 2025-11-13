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
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
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
  sequence INTEGER NOT NULL CHECK (sequence >= 0), -- item's order inside the block
  block_id INTEGER,
  FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE SET NULL
);

-- User items table
CREATE TABLE IF NOT EXISTS user_items (
  user_id UUID NOT NULL,
  item_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  started_at TIMESTAMP, 
  updated_at TIMESTAMP, 
  next_at TIMESTAMP NOT NULL DEFAULT '9999-12-31T23:59:59Z', -- placeholder for null, Indexed DB does not support nulls in indexed fields
  learned_at TIMESTAMP, 
  mastered_at TIMESTAMP NOT NULL DEFAULT '9999-12-31T23:59:59Z', -- placeholder for null, Indexed DB does not support nulls in indexed fields
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, item_id)
);

-- User score table
CREATE TABLE IF NOT EXISTS user_score (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);