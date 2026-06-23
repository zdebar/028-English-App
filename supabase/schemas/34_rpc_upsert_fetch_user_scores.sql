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
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
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
