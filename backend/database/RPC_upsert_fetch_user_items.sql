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
  note TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_study_item BOOLEAN,
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
SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_auth_user_id UUID;
  v_history_enabled BOOLEAN := FALSE;
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

  SELECT COALESCE(u.history_enabled, FALSE)
    INTO v_history_enabled
    FROM public.users u
   WHERE u.id = p_user_id;


  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    -- Validate every user_id in p_user_items matches p_user_id
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;
