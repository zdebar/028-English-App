-- INSERT
CREATE OR REPLACE FUNCTION insert_user_items(
  user_id_input UUID,
  items JSONB
)
RETURNS VOID AS $$
BEGIN
  IF items IS NULL OR items = '[]'::JSONB THEN
    RETURN;
  END IF;

  INSERT INTO user_items (user_id, item_id, progress, started_at, updated_at, next_at, learned_at, mastered_at)
  SELECT
    user_id_input AS user_id, 
    (item->>'item_id')::INT AS item_id,
    (item->>'progress')::INT AS progress,
    (item->>'started_at')::TIMESTAMPTZ AS started_at,
    (item->>'updated_at')::TIMESTAMPTZ AS updated_at,
    (item->>'next_at')::TIMESTAMPTZ AS next_at,
    (item->>'learned_at')::TIMESTAMPTZ AS learned_at,
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
    learned_at = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.learned_at
      ELSE user_items.learned_at
    END,
    mastered_at = CASE
      WHEN EXCLUDED.updated_at > user_items.updated_at OR user_items.updated_at IS NULL THEN EXCLUDED.mastered_at
      ELSE user_items.mastered_at
    END;
END;
$$ LANGUAGE plpgsql;

-- SELECT
CREATE OR REPLACE FUNCTION fetch_user_items(
  user_id_input UUID,
  last_synced_at TIMESTAMP
)
RETURNS TABLE (
  item_id INT,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  sequence INT,
  grammar_id INT,
  progress INT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  learned_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id AS item_id,
    user_id_input AS user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    i.sequence,
    COALESCE(i.grammar_id, -1) AS grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    COALESCE(ui.started_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS started_at, 
    ui.updated_at::TIMESTAMPTZ AS updated_at,
    i.deleted_at::TIMESTAMPTZ AS deleted_at,
    COALESCE(ui.next_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS next_at, 
    COALESCE(ui.learned_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS learned_at,
    COALESCE(ui.mastered_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS mastered_at
  FROM public.items i
  LEFT JOIN public.user_items ui 
    ON i.id = ui.item_id AND ui.user_id = user_id_input
  WHERE ui.updated_at > last_synced_at OR ui.updated_at IS NULL OR i.updated_at > last_synced_at
  ORDER BY i.sequence ASC;
END;
$$ LANGUAGE plpgsql;