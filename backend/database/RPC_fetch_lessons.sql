CREATE OR REPLACE FUNCTION public.fetch_lessons(
  p_last_synced_at TIMESTAMPTZ,
)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  note TEXT,
  level_id INTEGER,
  sort_order INTEGER,
  deleted_at TIMESTAMPTZ
)
LANGUAGE sql
SET search_path = public, pg_temp
AS $$
  SELECT ls.id, ls.name, ls.note, ls.level_id, ls.sort_order, ls.deleted_at
  FROM public.lessons ls
  WHERE ls.updated_at > p_last_synced_at
$$;