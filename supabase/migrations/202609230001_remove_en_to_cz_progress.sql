BEGIN;

-- Remove the old RPC definitions before dropping the columns from their return
-- types and payloads. Existing CZ-to-EN values remain untouched.
DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_user_items(JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

DROP INDEX IF EXISTS public.idx_user_items_user_updated_item;
DROP INDEX IF EXISTS public.idx_user_items_item_user;

ALTER TABLE public.user_items
  DROP COLUMN IF EXISTS progress_en_to_cz,
  DROP COLUMN IF EXISTS next_at_en_to_cz,
  DROP COLUMN IF EXISTS mastered_at_en_to_cz;

CREATE INDEX idx_user_items_user_updated_item
  ON public.user_items (user_id, updated_at, item_id)
  INCLUDE (
    progress_cz_to_en,
    started_at,
    next_at_cz_to_en,
    mastered_at_cz_to_en
  );

CREATE INDEX idx_user_items_item_user
  ON public.user_items (item_id, user_id)
  INCLUDE (
    progress_cz_to_en,
    started_at,
    updated_at,
    next_at_cz_to_en,
    mastered_at_cz_to_en
  );

CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_vocabulary BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  topic_id INTEGER,
  grammar_chunk_id INTEGER,
  progress_cz_to_en INTEGER,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at_cz_to_en TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ,
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
    i.is_vocabulary,
    i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, i.sort_order]::INTEGER[]
      AS curriculum_sort_path,
    i.note_id,
    i.block_id,
    i.topic_id,
    i.grammar_chunk_id,
    COALESCE(ui.progress_cz_to_en, 0) AS progress_cz_to_en,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at) AS updated_at,
    i.deleted_at,
    ui.next_at_cz_to_en,
    ui.mastered_at_cz_to_en,
    i.lesson_id
  FROM public.items i
  JOIN public.lessons le ON le.id = i.lesson_id
  JOIN public.levels lv ON lv.id = le.level_id
  LEFT JOIN public.user_items ui
    ON ui.item_id = i.id
    AND ui.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ui.updated_at, public.rpc_min_timestamptz()),
      i.updated_at,
      le.updated_at,
      lv.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
    AND (
      p_sync_until IS NULL
      OR GREATEST(
        COALESCE(ui.updated_at, public.rpc_min_timestamptz()),
        i.updated_at,
        le.updated_at,
        lv.updated_at
      ) <= p_sync_until
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_user_items(
  p_user_items JSONB
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
  v_progress_cz_to_en INT;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at_cz_to_en TIMESTAMPTZ;
  v_mastered_at_cz_to_en TIMESTAMPTZ;
  v_row_count INT := 0;
  v_main_error_count INT := 0;
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_item_id_re CONSTANT TEXT := '^[0-9]+$';
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_key_item_id CONSTANT TEXT := 'item_id';
  v_key_progress_cz_to_en CONSTANT TEXT := 'progress_cz_to_en';
  v_key_started_at CONSTANT TEXT := 'started_at';
  v_key_updated_at CONSTANT TEXT := private.json_key_updated_at();
  v_key_next_at_cz_to_en CONSTANT TEXT := 'next_at_cz_to_en';
  v_key_mastered_at_cz_to_en CONSTANT TEXT := 'mastered_at_cz_to_en';
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
      PERFORM 1 FROM public.items i WHERE i.id = v_item_id;
      IF NOT FOUND THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress_cz_to_en := GREATEST((v_entry->>v_key_progress_cz_to_en)::INT, 0);
      v_started_at := NULLIF(v_entry->>v_key_started_at, v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;
      v_next_at_cz_to_en := NULLIF(v_entry->>v_key_next_at_cz_to_en, v_null_text)::TIMESTAMPTZ;
      v_mastered_at_cz_to_en := NULLIF(v_entry->>v_key_mastered_at_cz_to_en, v_null_text)::TIMESTAMPTZ;

      INSERT INTO public.user_items (
        user_id,
        item_id,
        progress_cz_to_en,
        started_at,
        updated_at,
        next_at_cz_to_en,
        mastered_at_cz_to_en
      )
      VALUES (
        v_user_id,
        v_item_id,
        v_progress_cz_to_en,
        v_started_at,
        v_updated_at,
        v_next_at_cz_to_en,
        v_mastered_at_cz_to_en
      )
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET
        progress_cz_to_en = EXCLUDED.progress_cz_to_en,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at_cz_to_en = EXCLUDED.next_at_cz_to_en,
        mastered_at_cz_to_en = EXCLUDED.mastered_at_cz_to_en
      WHERE COALESCE(EXCLUDED.updated_at, public.rpc_min_timestamptz())
        > COALESCE(public.user_items.updated_at, public.rpc_min_timestamptz());

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_matched_count := v_matched_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE;
      WHEN others THEN
        v_skipped_count := v_skipped_count + 1;
        v_main_error_count := v_main_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_items: incoming=% upserted=% skipped=% errors=%',
    v_total_count, v_matched_count, v_skipped_count, v_main_error_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_vocabulary BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  topic_id INTEGER,
  grammar_chunk_id INTEGER,
  progress_cz_to_en INTEGER,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at_cz_to_en TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ,
  lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_user_id_mismatch_message CONSTANT TEXT :=
    'p_user_id does not match at least one user_id in p_user_items';
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_items IS NOT NULL AND p_user_items <> v_empty_json THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION '%', v_user_id_mismatch_message;
    END IF;
    PERFORM public.upsert_user_items(p_user_items);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_items(p_user_id, p_last_synced_at, p_sync_until);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
) TO authenticated;

COMMIT;
