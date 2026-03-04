CREATE OR REPLACE FUNCTION public.upsert_user_items(
  p_user_items JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_user_items IS NULL OR p_user_items = '[]'::JSONB THEN
    RETURN;
  END IF;

  -- Extract user_id from the first element
  SELECT (entry->>'user_id')::UUID
    INTO v_user_id
    FROM jsonb_array_elements(p_user_items) AS entry
    LIMIT 1;

  INSERT INTO public.user_items (
    user_id,
    item_id,
    progress,
    started_at,
    updated_at,
    next_at,
    mastered_at
  )
  SELECT
    (entry->>'user_id')::UUID AS user_id,
    (entry->>'item_id')::INT AS item_id,
    GREATEST((entry->>'progress')::INT, 0) AS progress,
    (entry->>'started_at')::TIMESTAMPTZ AS started_at,
    (entry->>'updated_at')::TIMESTAMPTZ AS updated_at,
    (entry->>'next_at')::TIMESTAMPTZ AS next_at,
    (entry->>'mastered_at')::TIMESTAMPTZ AS mastered_at
  FROM jsonb_array_elements(p_user_items) AS entry
    WHERE (entry->>'started_at') IS NOT NULL AND (entry->>'started_at') <> 'null'
      AND entry->>'item_id' ~ '^\d+$'
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET
    progress = CASE
      WHEN EXCLUDED.updated_at >= public.user_items.updated_at THEN EXCLUDED.progress
      ELSE public.user_items.progress
    END,
    started_at = CASE
      WHEN EXCLUDED.updated_at >= public.user_items.updated_at THEN EXCLUDED.started_at
      ELSE public.user_items.started_at
    END,
    updated_at = GREATEST(public.user_items.updated_at, EXCLUDED.updated_at),
    next_at = CASE
      WHEN EXCLUDED.updated_at >= public.user_items.updated_at THEN EXCLUDED.next_at
      ELSE public.user_items.next_at
    END,
    mastered_at = CASE
      WHEN EXCLUDED.updated_at >= public.user_items.updated_at THEN EXCLUDED.mastered_at
      ELSE public.user_items.mastered_at
    END;
END;
$$