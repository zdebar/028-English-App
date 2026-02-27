CREATE OR REPLACE FUNCTION public.fetch_user_scores(
  p_last_synced_at TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS TABLE (
  user_id UUID,
  date DATE,
  item_count INTEGER,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  SELECT us.user_id, us.date, us.item_count, us.updated_at
  FROM public.user_scores us
  WHERE us.updated_at > p_last_synced_at
    AND us.user_id = p_user_id;
$$;