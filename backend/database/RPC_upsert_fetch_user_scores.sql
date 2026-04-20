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

  IF p_user_scores IS NOT NULL AND p_user_scores <> '[]'::JSONB THEN
    -- Validate every user_id in p_user_scores matches p_user_id
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_scores) AS entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_scores';
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
    AND us.updated_at >= p_last_synced_at
  ORDER BY us.date ASC;
END;
$$;
