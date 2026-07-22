ALTER TABLE public.blocks
  ADD COLUMN requires_initial_training BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.blocks
SET requires_initial_training = TRUE
WHERE id IN (2, 3, 4, 5, 6);

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);

CREATE FUNCTION public.fetch_user_items(
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
  is_vocabulary BOOLEAN,
  is_practice_item BOOLEAN,
  requires_initial_training BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  grammar_chunk_id INTEGER,
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
    (b.grammar_chunk_id IS NULL) AS is_vocabulary,
    b.is_practice_block AS is_practice_item,
    b.requires_initial_training,
    i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, b.sort_order, i.sort_order]::INTEGER[]
      AS curriculum_sort_path,
    i.note_id,
    i.block_id,
    b.grammar_chunk_id,
    COALESCE(ui.progress, 0) AS progress,
    '[]'::JSONB AS progress_history,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at) AS updated_at,
    i.deleted_at,
    ui.next_at,
    ui.mastered_at,
    b.lesson_id
  FROM public.items i
  JOIN public.blocks b ON b.id = i.block_id
  JOIN public.lessons le ON le.id = b.lesson_id
  JOIN public.levels lv ON lv.id = le.level_id
  LEFT JOIN public.user_items ui ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(
    COALESCE(ui.updated_at, public.rpc_min_timestamptz()),
    i.updated_at,
    b.updated_at,
    le.updated_at,
    lv.updated_at
  ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

CREATE FUNCTION public.upsert_fetch_user_items(
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
  is_vocabulary BOOLEAN,
  is_practice_item BOOLEAN,
  requires_initial_training BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  grammar_chunk_id INTEGER,
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
  v_history_enabled BOOLEAN := FALSE;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  SELECT COALESCE(u.history_enabled, FALSE)
    INTO v_history_enabled
    FROM public.users u
   WHERE u.id = p_user_id;

  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;

  RETURN QUERY
  SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);

CREATE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  lesson_id INTEGER,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  show_in_topics BOOLEAN,
  is_practice_block BOOLEAN,
  requires_initial_training BOOLEAN,
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
    b.lesson_id,
    b.grammar_chunk_id,
    b.sort_order,
    COALESCE(ub.progress, 0) AS progress,
    (b.grammar_chunk_id IS NULL) AS is_vocabulary,
    b.show_in_topics,
    b.is_practice_block,
    b.requires_initial_training,
    ub.started_at,
    GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) AS updated_at,
    ub.next_at,
    ub.mastered_at,
    b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub ON ub.block_id = b.id AND ub.user_id = p_user_id
  WHERE GREATEST(
    COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
    b.updated_at
  ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC;
END;
$$;

CREATE FUNCTION public.upsert_fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_blocks JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  lesson_id INTEGER,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  show_in_topics BOOLEAN,
  is_practice_block BOOLEAN,
  requires_initial_training BOOLEAN,
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
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_blocks IS NOT NULL AND p_user_blocks <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_blocks) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_blocks';
    END IF;
    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;

  RETURN QUERY
  SELECT * FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
