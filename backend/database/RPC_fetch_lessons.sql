CREATE OR REPLACE FUNCTION public.fetch_lessons(
  p_last_synced_at TIMESTAMPTZ,
)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  sort_order INTEGER,
  level_name TEXT,
  deleted_at TIMESTAMPTZ
)
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  SELECT ls.id, ls.name, ls.sort_order, le.name as level_name, ls.deleted_at
  FROM public.lessons ls
  LEFT JOIN public.levels le ON le.id = ls.level_id
  WHERE ls.updated_at > p_last_synced_at
    OR le.deleted_at > p_last_synced_at
$$;