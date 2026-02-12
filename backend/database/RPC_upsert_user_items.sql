-- INSERT
CREATE OR REPLACE FUNCTION upsert_user_items(
  user_id_input UUID,
  items JSONB
)
RETURNS VOID AS $$
BEGIN
  IF items IS NULL OR items = '[]'::JSONB THEN
    RETURN;
  END IF;

  INSERT INTO user_items (user_id, item_id, progress, started_at, updated_at, next_at, mastered_at)
  SELECT
    user_id_input AS user_id, 
    (item->>'item_id')::INT AS item_id,
    (item->>'progress')::INT AS progress,
    (item->>'started_at')::TIMESTAMPTZ AS started_at,
    (item->>'updated_at')::TIMESTAMPTZ AS updated_at,
    (item->>'next_at')::TIMESTAMPTZ AS next_at,
    (item->>'mastered_at')::TIMESTAMPTZ AS mastered_at
  FROM jsonb_array_elements(items) AS item
  WHERE item->>'item_id' ~ '^\d+$' 
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET
    progress = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.progress
      ELSE user_items.progress
    END,
    started_at = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.started_at
      ELSE user_items.started_at
    END,
    updated_at = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.updated_at
      ELSE user_items.updated_at
    END,
    next_at = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.next_at
      ELSE user_items.next_at
    END,
    mastered_at = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.mastered_at
      ELSE user_items.mastered_at
    END;
END;
$$ LANGUAGE plpgsql
SET search_path TO public;