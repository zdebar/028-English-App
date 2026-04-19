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
  sort_order INTEGER,
  grammar_id INTEGER,
  progress INTEGER,
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
  v_payload_user_id UUID;
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

  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    SELECT (entry->>'user_id')::UUID
      INTO v_payload_user_id
      FROM jsonb_array_elements(p_user_items) AS entry
      LIMIT 1;

    IF v_payload_user_id IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION 'p_user_id does not match p_user_items user_id';
    END IF;

    PERFORM public.upsert_user_items(p_user_items);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;
