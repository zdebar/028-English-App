-- Initial schema generated from supabase/schemas for local start/reset.

-- Source: supabase/schemas/00_public_tables.sql


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
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL,
  level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE RESTRICT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_blocks (
  block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  is_vocabulary BOOLEAN NOT NULL DEFAULT FALSE, -- distinguish between sentences and vocabulary items
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
  is_study_item BOOLEAN NOT NULL DEFAULT TRUE, -- true - will show in PracticeDeck, if false - only in Blocks (intended for spelling)
  is_vocabulary BOOLEAN NOT NULL DEFAULT TRUE, -- distinguish between sentences and vocabulary items
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 0), 
  block_id INTEGER REFERENCES blocks(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_items_note_id ON public.items (note_id);
CREATE INDEX IF NOT EXISTS idx_items_block_id ON public.items (block_id);
CREATE INDEX IF NOT EXISTS idx_items_grammar_id ON public.items (grammar_id);
CREATE INDEX IF NOT EXISTS idx_items_lesson_id ON public.items (lesson_id);

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

-- Source: supabase/schemas/10_updated_at_triggers.sql

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar ON public.grammar;
CREATE TRIGGER trg_set_updated_at__grammar
BEFORE UPDATE ON public.grammar
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__levels ON public.levels;
CREATE TRIGGER trg_set_updated_at__levels
BEFORE UPDATE ON public.levels
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__lessons ON public.lessons;
CREATE TRIGGER trg_set_updated_at__lessons
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__notes ON public.notes;
CREATE TRIGGER trg_set_updated_at__notes
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__items ON public.items;
CREATE TRIGGER trg_set_updated_at__items
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_items ON public.user_items;
CREATE TRIGGER trg_set_updated_at__user_items
BEFORE UPDATE ON public.user_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_scores ON public.user_scores;
CREATE TRIGGER trg_set_updated_at__user_scores
BEFORE UPDATE ON public.user_scores
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_blocks ON public.user_blocks;
CREATE TRIGGER trg_set_updated_at__user_blocks
BEFORE UPDATE ON public.user_blocks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();



-- Source: supabase/schemas/20_auth_helpers.sql

CREATE OR REPLACE FUNCTION public.require_auth_user_id()
RETURNS UUID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN v_auth_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_auth_user_id_match(
  p_user_id UUID,
  p_param_name TEXT DEFAULT 'p_user_id'
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_default_param_name CONSTANT TEXT := 'p_user_id';
  v_param_name TEXT;
BEGIN
  v_param_name := COALESCE(NULLIF(p_param_name, ''), v_default_param_name);

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION '% is required', v_param_name;
  END IF;

  v_auth_user_id := public.require_auth_user_id();
  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION '% must match auth.uid()', v_param_name;
  END IF;

  RETURN v_auth_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_payload_user_id_matches_auth(
  p_payload_user_id UUID,
  p_auth_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF p_payload_user_id IS DISTINCT FROM p_auth_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Payload user_id must match auth.uid()';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.require_auth_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_auth_user_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.require_auth_user_id_match(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_auth_user_id_match(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assert_payload_user_id_matches_auth(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_payload_user_id_matches_auth(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_min_timestamptz()
RETURNS TIMESTAMPTZ
LANGUAGE sql
SET search_path TO public
AS $$
  SELECT '-infinity'::timestamptz;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_min_timestamptz() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_min_timestamptz() TO authenticated;

-- Source: supabase/schemas/30_rpc_fetch_user_items.sql

CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_study_item BOOLEAN,
  is_vocabulary BOOLEAN,
  sort_order INTEGER,
  note_id INTEGER,
  block_id INTEGER,
  grammar_id INTEGER,
  progress INTEGER,
  progress_history JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  RETURN QUERY
  SELECT
    i.id AS item_id,
    p_user_id AS user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    i.is_study_item,
    i.is_vocabulary,
    i.sort_order,
    i.note_id,
    i.block_id,
    i.grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    '[]'::jsonb AS progress_history,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at) AS updated_at,
    i.deleted_at,
    ui.next_at,
    ui.mastered_at,
    i.lesson_id
  FROM public.items i
  LEFT JOIN public.user_items ui
    ON ui.item_id = i.id
    AND ui.user_id = p_user_id
  WHERE GREATEST(COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at)
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;

-- Source: supabase/schemas/31_rpc_upsert_user_items.sql

CREATE OR REPLACE FUNCTION public.upsert_user_items(
  p_user_items JSONB,
  p_history_enabled BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_item_id INT;
  v_progress INT;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at TIMESTAMPTZ;
  v_mastered_at TIMESTAMPTZ;
  v_row_count INT := 0;
  v_main_error_count INT := 0;
  -- constants to avoid duplicated literals
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_item_id_re CONSTANT TEXT := '^[0-9]+$';
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_key_item_id CONSTANT TEXT := 'item_id';
  v_key_progress CONSTANT TEXT := 'progress';
  v_key_started_at CONSTANT TEXT := 'started_at';
  v_key_updated_at CONSTANT TEXT := 'updated_at';
  v_key_next_at CONSTANT TEXT := 'next_at';
  v_key_mastered_at CONSTANT TEXT := 'mastered_at';
  v_key_progress_history CONSTANT TEXT := 'progress_history';
  v_key_created_at CONSTANT TEXT := 'created_at';
  v_total_count INT := 0;
  v_matched_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  IF p_user_items IS NULL OR p_user_items = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    v_total_count := v_total_count + 1;
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_item_id := (v_entry->>v_key_item_id)::INT;

      -- skip entries for items that no longer exist (avoid FK errors)
      IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress := GREATEST((v_entry->>v_key_progress)::INT, 0);
      v_started_at := NULLIF(v_entry->>v_key_started_at, v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;
      v_next_at := (v_entry->>v_key_next_at)::TIMESTAMPTZ;
      v_mastered_at := (v_entry->>v_key_mastered_at)::TIMESTAMPTZ;

      INSERT INTO public.user_items (
        user_id,
        item_id,
        progress,
        started_at,
        updated_at,
        next_at,
        mastered_at
      )
      VALUES (
        v_user_id,
        v_item_id,
        v_progress,
        v_started_at,
        v_updated_at,
        v_next_at,
        v_mastered_at
      )
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at = EXCLUDED.next_at,
        mastered_at = EXCLUDED.mastered_at
      WHERE COALESCE(EXCLUDED.updated_at, public.rpc_min_timestamptz())
        >= COALESCE(public.user_items.updated_at, public.rpc_min_timestamptz());

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_matched_count := v_matched_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_count := v_skipped_count + 1;
        v_main_error_count := v_main_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_items: incoming=% upserted=% skipped=% errors=%',
    v_total_count,
    v_matched_count,
    v_skipped_count,
    v_main_error_count;

  IF NOT COALESCE(p_history_enabled, FALSE) THEN
    RAISE LOG 'user_items_history: inserted=0, skipped_invalid=0, skipped_existing=0, skipped_disabled=1, errors=0';
    RETURN;
  END IF;

  -- Best-effort insert of progress history: validate created_at, skip invalid rows.
  -- Do not make history insertion fatal for the whole upsert operation.
  DECLARE
    v_entry jsonb;
    v_hist jsonb;
    v_item_id INT;
    v_hist_user_id UUID;
    v_progress INT;
    v_created_at timestamptz;
    v_inserted_count INT := 0;
    v_skipped_invalid INT := 0;
    v_error_count INT := 0;
    v_skipped_existing INT := 0;
  BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
      BEGIN
        v_hist_user_id := (v_entry->>v_key_user_id)::UUID;
        PERFORM public.assert_payload_user_id_matches_auth(v_hist_user_id, v_auth_user_id);

        -- skip entries without numeric item_id
        IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
          CONTINUE;
        END IF;
        v_item_id := (v_entry->>v_key_item_id)::INT;

        -- skip history for items that no longer exist (avoid FK errors)
        IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
          CONTINUE;
        END IF;
        FOR v_hist IN SELECT * FROM jsonb_array_elements(COALESCE(v_entry->v_key_progress_history, v_empty_json)) LOOP
          BEGIN
            -- validate and parse created_at; if invalid, skip this hist entry
            IF (v_hist->>v_key_created_at) IS NULL THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END IF;
            BEGIN
              v_created_at := (v_hist->>v_key_created_at)::timestamptz;
            EXCEPTION WHEN others THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END;

            v_progress := (v_hist->>v_key_progress)::INT;

            -- Insert if not exists (avoid duplicates). Use ON CONFLICT DO NOTHING if unique constraint added.
            BEGIN
              INSERT INTO public.user_items_history (item_id, user_id, progress, created_at)
              VALUES (v_item_id, v_hist_user_id, v_progress, v_created_at)
              ON CONFLICT DO NOTHING;
              IF FOUND THEN
                v_inserted_count := v_inserted_count + 1;
              ELSE
                v_skipped_existing := v_skipped_existing + 1;
              END IF;
            EXCEPTION WHEN others THEN
              v_error_count := v_error_count + 1;
              -- continue with next history item
            END;
          END;
        END LOOP;
      EXCEPTION
        WHEN insufficient_privilege THEN
          RAISE;
        WHEN others THEN
          v_skipped_invalid := v_skipped_invalid + 1;
          v_error_count := v_error_count + 1;
          CONTINUE;
      END;
    END LOOP;

    -- Log result so operator can be aware when items were skipped/failed.
    RAISE LOG 'user_items_history: inserted=%, skipped_invalid=%, skipped_existing=%, skipped_disabled=0, errors=%', v_inserted_count, v_skipped_invalid, v_skipped_existing, v_error_count;
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) TO authenticated;

-- Source: supabase/schemas/32_rpc_upsert_fetch_user_items.sql

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_study_item BOOLEAN,
  is_vocabulary BOOLEAN,
  sort_order INTEGER,
  note_id INTEGER,
  block_id INTEGER,
  grammar_id INTEGER,
  progress INTEGER,
  progress_history JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_history_enabled BOOLEAN := FALSE;
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_user_id_mismatch_message CONSTANT TEXT := 'p_user_id does not match at least one user_id in p_user_items';
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  SELECT COALESCE(u.history_enabled, FALSE)
    INTO v_history_enabled
    FROM public.users u
   WHERE u.id = p_user_id;


  IF p_user_items IS NOT NULL AND p_user_items <> v_empty_json THEN
    -- Validate every user_id in p_user_items matches p_user_id
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION '%', v_user_id_mismatch_message;
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) TO authenticated;

-- Source: supabase/schemas/33_rpc_upsert_user_scores.sql

CREATE OR REPLACE FUNCTION public.upsert_user_scores(
  p_user_scores JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_date DATE;
  v_item_count INTEGER;
  v_updated_at TIMESTAMPTZ;
  v_upserted_count INT := 0;
  v_skipped_invalid INT := 0;
  v_error_count INT := 0;
  v_row_count INT := 0;
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_key_date CONSTANT TEXT := 'date';
  v_key_item_count CONSTANT TEXT := 'item_count';
  v_key_updated_at CONSTANT TEXT := 'updated_at';
BEGIN
  IF p_user_scores IS NULL OR p_user_scores = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_scores) LOOP
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      v_date := (v_entry->>v_key_date)::DATE;
      v_item_count := GREATEST((v_entry->>v_key_item_count)::INTEGER, 0);
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;

      INSERT INTO public.user_scores (user_id, date, item_count, updated_at)
      VALUES (v_user_id, v_date, v_item_count, v_updated_at)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        item_count = GREATEST(public.user_scores.item_count, EXCLUDED.item_count),
        updated_at = GREATEST(public.user_scores.updated_at, EXCLUDED.updated_at);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_upserted_count := v_upserted_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_invalid := v_skipped_invalid + 1;
        v_error_count := v_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_scores: upserted=%, skipped_invalid=%, errors=%',
    v_upserted_count,
    v_skipped_invalid,
    v_error_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) TO authenticated;

-- Source: supabase/schemas/34_rpc_upsert_fetch_user_scores.sql

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_scores(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_scores JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  date DATE,
  item_count INTEGER,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_user_id_mismatch_message CONSTANT TEXT := 'p_user_id does not match at least one user_id in p_user_scores';
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_scores IS NOT NULL AND p_user_scores <> v_empty_json THEN
    -- Validate every user_id in p_user_scores matches p_user_id
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_scores) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION '%', v_user_id_mismatch_message;
    END IF;
    PERFORM public.upsert_user_scores(p_user_scores);
  END IF;

  RETURN QUERY
  SELECT
    us.user_id,
    us.date,
    us.item_count,
    us.updated_at,
    us.deleted_at
  FROM public.user_scores us
  WHERE us.user_id = p_user_id
    AND us.updated_at >= COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY us.date ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_scores(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_scores(UUID, TIMESTAMPTZ, JSONB) TO authenticated;

-- Source: supabase/schemas/35_rpc_fetch_user_blocks.sql

CREATE OR REPLACE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  RETURN QUERY
  SELECT
    p_user_id AS user_id,
    b.id AS block_id,
    b.name,
    b.note,
    b.sort_order,
    COALESCE(ub.progress, 0) AS progress,
    COALESCE(ub.is_vocabulary, FALSE) AS is_vocabulary,
    ub.started_at,
    GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) AS updated_at,
    ub.next_at,
    ub.mastered_at,
    b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub
    ON ub.block_id = b.id
    AND ub.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;

-- Source: supabase/schemas/36_rpc_upsert_user_blocks.sql

CREATE OR REPLACE FUNCTION public.upsert_user_blocks(
  p_user_blocks JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_block_id INT;
  v_progress INT;
  v_is_vocabulary BOOLEAN;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at TIMESTAMPTZ;
  v_mastered_at TIMESTAMPTZ;
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_key_block_id CONSTANT TEXT := 'block_id';
  v_key_progress CONSTANT TEXT := 'progress';
  v_key_is_vocabulary CONSTANT TEXT := 'is_vocabulary';
  v_key_started_at CONSTANT TEXT := 'started_at';
  v_key_updated_at CONSTANT TEXT := 'updated_at';
  v_key_next_at CONSTANT TEXT := 'next_at';
  v_key_mastered_at CONSTANT TEXT := 'mastered_at';
  v_row_count INT := 0;
  v_upserted_count INT := 0;
  v_skipped_count INT := 0;
  v_error_count INT := 0;
BEGIN
  IF p_user_blocks IS NULL OR p_user_blocks = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_blocks) LOOP
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      v_block_id := (v_entry->>v_key_block_id)::INT;
      IF NOT EXISTS (SELECT 1 FROM public.blocks WHERE id = v_block_id) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress := GREATEST((v_entry->>v_key_progress)::INT, 0);
      v_is_vocabulary := COALESCE((v_entry->>v_key_is_vocabulary)::BOOLEAN, FALSE);
      v_started_at := NULLIF(v_entry->>v_key_started_at, v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;
      v_next_at := NULLIF(v_entry->>v_key_next_at, v_null_text)::TIMESTAMPTZ;
      v_mastered_at := NULLIF(v_entry->>v_key_mastered_at, v_null_text)::TIMESTAMPTZ;

      INSERT INTO public.user_blocks (
        user_id,
        block_id,
        progress,
        is_vocabulary,
        started_at,
        updated_at,
        next_at,
        mastered_at
      )
      VALUES (
        v_user_id,
        v_block_id,
        v_progress,
        v_is_vocabulary,
        v_started_at,
        v_updated_at,
        v_next_at,
        v_mastered_at
      )
      ON CONFLICT (block_id, user_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        is_vocabulary = EXCLUDED.is_vocabulary,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at = EXCLUDED.next_at,
        mastered_at = EXCLUDED.mastered_at
      WHERE COALESCE(EXCLUDED.updated_at, public.rpc_min_timestamptz())
        >= COALESCE(public.user_blocks.updated_at, public.rpc_min_timestamptz());

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_upserted_count := v_upserted_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_count := v_skipped_count + 1;
        v_error_count := v_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_blocks: upserted=%, skipped=%, errors=%',
    v_upserted_count,
    v_skipped_count,
    v_error_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_blocks(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_blocks(JSONB) TO authenticated;

-- Source: supabase/schemas/37_rpc_upsert_fetch_user_blocks.sql

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_blocks JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_user_id_mismatch_message CONSTANT TEXT := 'p_user_id does not match at least one user_id in p_user_blocks';
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_blocks IS NOT NULL AND p_user_blocks <> v_empty_json THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_blocks) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION '%', v_user_id_mismatch_message;
    END IF;
    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;

-- Source: supabase/schemas/40_user_lifecycle_functions.sql

CREATE OR REPLACE FUNCTION public.soft_delete_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.users
    SET deleted_at = NOW()
  WHERE id = auth.uid();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.reactivate_user_if_deleted()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.users
    SET deleted_at = NULL
  WHERE id = auth.uid()
    AND deleted_at IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reactivate_user_if_deleted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivate_user_if_deleted() TO authenticated;

CREATE OR REPLACE FUNCTION private.hard_delete_deleted_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_older_than INTERVAL;
  v_deleted INTEGER;
BEGIN
  SELECT (TRIM(BOTH '"' FROM s.value::TEXT))::INTERVAL
  INTO v_older_than
  FROM private.settings s
  WHERE s.key = 'soft_delete_retention';

  IF v_older_than IS NULL THEN
    v_older_than := INTERVAL '30 days';
  END IF;

  DELETE FROM public.users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - v_older_than;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.hard_delete_deleted_users() FROM anon, authenticated;

-- Source: supabase/schemas/41_anonymous_cleanup_function.sql

CREATE OR REPLACE FUNCTION public.delete_is_anonymous_users_older_than()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_older_than INTERVAL;
BEGIN
  SELECT (TRIM(BOTH '"' FROM s.value::TEXT))::INTERVAL
    INTO v_older_than
  FROM private.settings s
  WHERE s.key = 'is_anonymous_deletion';

  IF v_older_than IS NULL THEN
    RAISE NOTICE 'private.settings.is_anonymous_deletion is not set; skipping anonymous deletion.';
    RETURN;
  END IF;

  DELETE FROM auth.users
  WHERE is_anonymous IS TRUE
    AND created_at < (NOW() - v_older_than);

  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_is_anonymous_users_older_than() FROM anon, PUBLIC;

-- Source: supabase/schemas/90_rls.sql

SET search_path TO public;

CREATE OR REPLACE FUNCTION public.is_non_demo_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path TO public
AS $$
  SELECT COALESCE(((auth.jwt() -> 'app_metadata'::TEXT) ->> 'is_demo'::TEXT)::BOOLEAN, FALSE) = FALSE;
$$;

REVOKE EXECUTE ON FUNCTION public.is_non_demo_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_non_demo_user() TO authenticated;

-- Catalog tables are shared content. Anonymous app users still read these
-- through Supabase Auth, so the direct table grants target authenticated only.
REVOKE ALL PRIVILEGES ON TABLE
  public.blocks,
  public.grammar,
  public.items,
  public.lessons,
  public.levels,
  public.notes
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.blocks,
  public.grammar,
  public.items,
  public.lessons,
  public.levels,
  public.notes
TO authenticated;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.blocks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grammar;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lessons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.levels;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notes;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.blocks;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.grammar;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.items;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.lessons;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.levels;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.notes;

CREATE POLICY catalog_select_authenticated ON public.blocks
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.grammar
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.items
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.lessons
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.levels
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.notes
  FOR SELECT TO authenticated
  USING (TRUE);

REVOKE ALL PRIVILEGES ON TABLE public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE
  public.user_items,
  public.user_scores,
  public.user_blocks
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_items,
  public.user_scores,
  public.user_blocks
TO authenticated;

ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow regular users to modify their own data" ON public.user_items;
DROP POLICY IF EXISTS user_items_delete_own_non_demo ON public.user_items;
DROP POLICY IF EXISTS user_items_insert_own_non_demo ON public.user_items;
DROP POLICY IF EXISTS user_items_select_own ON public.user_items;
DROP POLICY IF EXISTS user_items_update_own_non_demo ON public.user_items;

CREATE POLICY user_items_select_own ON public.user_items
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_items_insert_own_non_demo ON public.user_items
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_items_update_own_non_demo ON public.user_items
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_items_delete_own_non_demo ON public.user_items
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

DROP POLICY IF EXISTS "Allow regular users to modify their own data" ON public.user_scores;
DROP POLICY IF EXISTS user_scores_delete_own_non_demo ON public.user_scores;
DROP POLICY IF EXISTS user_scores_insert_own_non_demo ON public.user_scores;
DROP POLICY IF EXISTS user_scores_select_own ON public.user_scores;
DROP POLICY IF EXISTS user_scores_update_own_non_demo ON public.user_scores;

CREATE POLICY user_scores_select_own ON public.user_scores
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_scores_insert_own_non_demo ON public.user_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_scores_update_own_non_demo ON public.user_scores
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_scores_delete_own_non_demo ON public.user_scores
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

DROP POLICY IF EXISTS user_blocks_delete_own_non_demo ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_insert_own_non_demo ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_select_own ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_update_own_non_demo ON public.user_blocks;

CREATE POLICY user_blocks_select_own ON public.user_blocks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_blocks_insert_own_non_demo ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_blocks_update_own_non_demo ON public.user_blocks
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_blocks_delete_own_non_demo ON public.user_blocks
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

REVOKE ALL PRIVILEGES ON TABLE public.user_items_history FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.user_items_history TO authenticated;

ALTER TABLE public.user_items_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.user_items_history;
DROP POLICY IF EXISTS user_items_history_insert_own ON public.user_items_history;

CREATE POLICY user_items_history_insert_own ON public.user_items_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
