CREATE OR REPLACE FUNCTION public.upsert_user_items(
  p_user_id UUID,
  p_user_items JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF p_user_items IS NULL OR p_user_items = '[]'::JSONB THEN
    RETURN;
  END IF;

    -- Delete rows where started_at is null
    DELETE FROM public.user_items
    WHERE user_id = p_user_id
      AND item_id IN (
        SELECT (entry->>'item_id')::INT
        FROM jsonb_array_elements(p_user_items) AS entry
        WHERE (entry->>'started_at') IS NULL OR (entry->>'started_at') = 'null'
      );

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
    p_user_id AS user_id,
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
$$;