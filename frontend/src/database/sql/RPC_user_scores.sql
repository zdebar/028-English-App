-- INSERT
CREATE OR REPLACE FUNCTION upsert_user_scores(
  scores JSONB
)
RETURNS VOID AS $$
BEGIN
  IF scores IS NOT NULL AND scores != '[]'::JSONB THEN
    INSERT INTO user_scores (user_id, date, item_count, updated_at)
    SELECT 
      (score->>'user_id')::UUID AS user_id,
      (score->>'date')::DATE AS date,
      (score->>'item_count')::INTEGER AS item_count,
      (score->>'updated_at')::TIMESTAMPTZ AS updated_at
    FROM jsonb_array_elements(scores) AS score
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      item_count = GREATEST(user_scores.item_count, EXCLUDED.item_count),
      updated_at = GREATEST(user_scores.updated_at, EXCLUDED.updated_at);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- SELECT
CREATE OR REPLACE FUNCTION fetch_user_scores(
  user_id_input UUID,
  last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  date DATE,
  item_count INTEGER,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT us.user_id, us.date, us.item_count, us.updated_at
  FROM user_scores us
  WHERE us.updated_at > last_synced_at
    AND us.user_id = user_id_input;
END;
$$ LANGUAGE plpgsql;