CREATE OR REPLACE FUNCTION fetch_user_items(
  user_id_input UUID,
  last_synced_at TIMESTAMPTZ,
  new_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  sequence INTEGER,
  grammar_id INTEGER,
  progress INTEGER,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id AS item_id,
    user_id_input AS user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    i.sequence,
    COALESCE(i.grammar_id, 0) AS grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    COALESCE(ui.started_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS started_at, 
    COALESCE(ui.updated_at, i.updated_at)::TIMESTAMPTZ AS updated_at,
    i.deleted_at::TIMESTAMPTZ AS deleted_at,
    COALESCE(ui.next_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS next_at, 
    COALESCE(ui.mastered_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS mastered_at
  FROM public.items i
  LEFT JOIN public.user_items ui 
    ON i.id = ui.item_id AND ui.user_id = user_id_input
  WHERE (
    (ui.updated_at BETWEEN last_synced_at AND new_synced_at)
    OR ui.updated_at IS NULL
    OR (i.updated_at BETWEEN last_synced_at AND new_synced_at)
  )
  ORDER BY i.sequence ASC;
END;
$$;