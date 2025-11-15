CREATE OR REPLACE FUNCTION upsert_and_return_user_scores(
  user_id_input UUID,
  scores JSONB,
  last_synced_at TIMESTAMP
)
RETURNS TABLE (
  user_id UUID,
  date DATE,
  item_count INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
) AS $$
BEGIN
  WITH upserted AS (
    INSERT INTO user_scores (user_id, date, item_count, created_at, updated_at, deleted_at)
    SELECT 
      score->>'user_id'::UUID AS user_id,
      score->>'date'::DATE AS date,
      (score->>'item_count')::INTEGER AS item_count,
      (score->>'created_at')::TIMESTAMP AS created_at,
      (score->>'updated_at')::TIMESTAMP AS updated_at,
      NULLIF(score->>'deleted_at', 'null')::TIMESTAMP AS deleted_at
    FROM jsonb_array_elements(scores) AS score
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      item_count = CASE
        WHEN user_scores.deleted_at IS NOT NULL THEN EXCLUDED.item_count
        ELSE GREATEST(user_scores.item_count, EXCLUDED.item_count)
      END,
      updated_at = GREATEST(user_scores.updated_at, EXCLUDED.updated_at),
      deleted_at = NULL 
    RETURNING *
  )
  SELECT * 
  FROM user_scores
  WHERE updated_at > last_synced_at
    AND user_id = user_id_input;
$$ LANGUAGE plpgsql;


-- USER ITEMS UPSERT FUNCTION
CREATE OR REPLACE FUNCTION sync_user_items(
  user_id_input UUID,
  items JSONB,
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
  -- Step 1: Upsert the provided items into the user_items table
  INSERT INTO user_items (user_id, item_id, progress, started_at, updated_at, next_at, learned_at, mastered_at, deleted_at)
  SELECT
    item->>'user_id'::UUID AS user_id,
    item->>'item_id'::INT AS item_id,
    item->>'progress'::INT AS progress,
    item->>'started_at'::TIMESTAMPTZ AS started_at,
    item->>'updated_at'::TIMESTAMPTZ AS updated_at,
    item->>'deleted_at'::TIMESTAMPTZ AS deleted_at,
    item->>'next_at'::TIMESTAMPTZ AS next_at,
    item->>'learned_at'::TIMESTAMPTZ AS learned_at,
    item->>'mastered_at'::TIMESTAMPTZ AS mastered_at
  FROM jsonb_array_elements(items) AS item
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET
      progress = CASE
          WHEN EXCLUDED.updated_at > user_items.updated_at THEN EXCLUDED.progress
          ELSE user_items.progress
      END,
      started_at = CASE
          WHEN EXCLUDED.updated_at > user_items.updated_at THEN EXCLUDED.started_at
          ELSE user_items.started_at
      END,
      updated_at = GREATEST(user_items.updated_at, EXCLUDED.updated_at),
      next_at = CASE
          WHEN EXCLUDED.updated_at > user_items.updated_at THEN EXCLUDED.next_at
          ELSE user_items.next_at
      END,
      learned_at = CASE
          WHEN EXCLUDED.updated_at > user_items.updated_at THEN EXCLUDED.learned_at
          ELSE user_items.learned_at
      END,
      mastered_at = CASE
          WHEN EXCLUDED.updated_at > user_items.updated_at THEN EXCLUDED.mastered_at
          ELSE user_items.mastered_at
      END,
      deleted_at = CASE
          WHEN EXCLUDED.updated_at > user_items.updated_at THEN EXCLUDED.deleted_at
          ELSE user_items.deleted_at
      END;

  -- Step 2: Return all items newer than last_synced_at
  RETURN QUERY
  SELECT 
    i.id AS item_id,
    user_id_input AS user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    ROW_NUMBER() OVER (ORDER BY b.sequence ASC, i.sequence ASC)::INT AS sequence,
    b.grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    COALESCE(ui.started_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS started_at, 
    COALESCE(ui.updated_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS updated_at,
    deleted_at, 
    COALESCE(ui.next_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS next_at, 
    COALESCE(ui.learned_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS learned_at,
    COALESCE(ui.mastered_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS mastered_at
  FROM public.items i
  LEFT JOIN public.user_items ui 
    ON i.id = ui.item_id AND ui.user_id = user_id_input
  LEFT JOIN public.blocks b
    ON i.block_id = b.id
  WHERE ui.updated_at > last_synced_at
  ORDER BY b.sequence ASC, i.sequence ASC;
END;
$$ LANGUAGE plpgsql;
