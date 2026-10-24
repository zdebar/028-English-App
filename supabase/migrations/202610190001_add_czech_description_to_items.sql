ALTER TABLE public.items
  ADD COLUMN czech_description TEXT DEFAULT NULL;

DROP FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ);
DROP FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  czech_description TEXT,
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
    i.czech_description,
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
  JOIN public.lessons le
    ON le.id = i.lesson_id
  JOIN public.levels lv
    ON lv.id = le.level_id
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

CREATE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  czech_description TEXT,
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
