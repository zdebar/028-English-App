ALTER TABLE public.blocks
  ADD COLUMN IF NOT EXISTS is_practice_block BOOLEAN NOT NULL DEFAULT TRUE;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);

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
  is_vocabulary BOOLEAN,
  is_practice_item BOOLEAN,
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
    b.is_vocabulary,
    b.is_practice_block AS is_practice_item,
    i.sort_order,
    i.note_id,
    i.block_id,
    b.grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    '[]'::jsonb AS progress_history,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at) AS updated_at,
    i.deleted_at,
    ui.next_at,
    ui.mastered_at,
    b.lesson_id
  FROM public.items i
  JOIN public.blocks b
    ON b.id = i.block_id
  LEFT JOIN public.user_items ui
    ON ui.item_id = i.id
    AND ui.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ui.updated_at, public.rpc_min_timestamptz()),
      i.updated_at,
      b.updated_at
    )
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;

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
  is_vocabulary BOOLEAN,
  is_practice_item BOOLEAN,
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
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_user_id_mismatch_message CONSTANT TEXT := 'p_user_id does not match at least one user_id in p_user_items';
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  SELECT COALESCE(u.history_enabled, FALSE)
    INTO v_history_enabled
    FROM public.users u
   WHERE u.id = p_user_id;

  IF p_user_items IS NOT NULL AND p_user_items <> v_empty_json THEN
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

CREATE OR REPLACE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  lesson_id INTEGER,
  grammar_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  show_in_topics BOOLEAN,
  is_practice_block BOOLEAN,
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
    b.grammar_id,
    b.sort_order,
    COALESCE(ub.progress, 0) AS progress,
    b.is_vocabulary,
    b.show_in_topics,
    b.is_practice_block,
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
  lesson_id INTEGER,
  grammar_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  show_in_topics BOOLEAN,
  is_practice_block BOOLEAN,
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
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
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
