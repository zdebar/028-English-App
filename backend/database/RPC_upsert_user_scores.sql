CREATE OR REPLACE FUNCTION public.upsert_user_scores(
  p_user_scores JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  IF p_user_scores IS NULL OR p_user_scores = '[]'::JSONB THEN
    RETURN;
  END IF;

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_user_scores) AS entry
    WHERE (entry->>'user_id')::UUID IS DISTINCT FROM v_auth_user_id
  ) THEN
    RAISE EXCEPTION 'Payload user_id must match auth.uid()';
  END IF;

  INSERT INTO public.user_scores (user_id, date, item_count, updated_at)
  SELECT
    (entry->>'user_id')::UUID AS user_id,
    (entry->>'date')::DATE AS date,
    GREATEST((entry->>'item_count')::INTEGER, 0) AS item_count,
    (entry->>'updated_at')::TIMESTAMPTZ AS updated_at
  FROM jsonb_array_elements(p_user_scores) AS entry
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    item_count = GREATEST(public.user_scores.item_count, EXCLUDED.item_count),
    updated_at = GREATEST(public.user_scores.updated_at, EXCLUDED.updated_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) TO authenticated;