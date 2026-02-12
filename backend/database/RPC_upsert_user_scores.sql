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
$$ LANGUAGE plpgsql
SET search_path TO public;