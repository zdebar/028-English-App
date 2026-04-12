CREATE OR REPLACE FUNCTION public.upsert_user_scores(
  p_user_scores JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF p_user_scores IS NULL OR p_user_scores = '[]'::JSONB THEN
    RETURN;
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