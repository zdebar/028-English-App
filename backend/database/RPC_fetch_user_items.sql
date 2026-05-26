CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  note TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_study_item BOOLEAN,
  is_vocabulary BOOLEAN,
  sort_order INTEGER,
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
  v_auth_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()';
  END IF;

  RETURN QUERY
  SELECT
    i.id AS item_id,
    p_user_id AS user_id,
    i.czech,
    i.english,
    n.note,
    i.pronunciation,
    i.audio,
    i.is_study_item,
    i.is_vocabulary,
    i.sort_order,
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
  LEFT JOIN public.notes n
    ON n.id = i.note_id
  WHERE GREATEST(COALESCE(ui.updated_at, '-infinity'::timestamptz), i.updated_at)
    > COALESCE(p_last_synced_at, '1970-01-01'::timestamptz);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;