CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  item_sort_order INTEGER,
  grammar_id INTEGER,
  progress INTEGER,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  level_id INTEGER,
  level_sort_order INTEGER,
  level_name TEXT,
  lesson_id INTEGER,
  lesson_sort_order INTEGER,
  lesson_name TEXT
)
LANGUAGE sql
SET search_path TO public
AS $$
  SELECT
    i.id AS item_id,
    p_user_id AS user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    i.sort_order AS item_sort_order,
    i.grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at) AS updated_at,
    i.deleted_at,
    ui.next_at,
    ui.mastered_at,
    lv.id AS level_id,
    lv.sort_order AS level_sort_order,
    lv.name AS level_name,
    le.id AS lesson_id,
    le.sort_order AS lesson_sort_order,
    le.name AS lesson_name
  FROM public.items i
  LEFT JOIN public.user_items ui
    ON ui.item_id = i.id
    AND ui.user_id = p_user_id
  LEFT JOIN public.lessons le
    ON le.id = i.lesson_id
  LEFT JOIN public.levels lv
    ON lv.id = le.level_id
  WHERE ui.updated_at > p_last_synced_at
    OR i.updated_at > p_last_synced_at
    OR le.updated_at > p_last_synced_at
    OR lv.updated_at > p_last_synced_at
  ORDER BY i.sort_order ASC, i.id ASC;
$$;