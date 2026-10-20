CREATE SCHEMA IF NOT EXISTS seed_legacy;
CREATE TABLE seed_legacy.topics (id INTEGER, name TEXT, note TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ);
CREATE TABLE seed_legacy.grammar_topics (id INTEGER, name TEXT, note TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ);
CREATE TABLE seed_legacy.grammar_groups (id INTEGER, name TEXT, note TEXT, grammar_topic_id INTEGER, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ);
CREATE TABLE seed_legacy.grammar_chunks (id INTEGER, name TEXT, note TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, grammar_group_id INTEGER);
CREATE TABLE seed_legacy.grammar_chunk_examples (grammar_chunk_id INTEGER, item_id INTEGER, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ);
CREATE TABLE seed_legacy.pronunciation_groups (id INTEGER, name TEXT, note TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ);
CREATE TABLE seed_legacy.pronunciation_group_items (pronunciation_group_id INTEGER, item_id INTEGER, sort_order INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, contrast_set INTEGER);
CREATE TABLE seed_legacy.items (id INTEGER PRIMARY KEY, czech TEXT NOT NULL, english TEXT NOT NULL, pronunciation TEXT, audio TEXT, note_id INTEGER, sort_order INTEGER NOT NULL, legacy_group_id INTEGER, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, grammar_chunk_id INTEGER, is_vocabulary BOOLEAN NOT NULL);
