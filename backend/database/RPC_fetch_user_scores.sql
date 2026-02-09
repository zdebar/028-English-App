CREATE OR REPLACE FUNCTION fetch_user_scores(
  last_synced_at timestamptz,
  new_synced_at timestamptz,
  user_id_input uuid
)
RETURNS TABLE (
  user_id uuid,
  date date,
  item_count integer,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT us.user_id, us.date, us.item_count, us.updated_at
  FROM user_scores us
  WHERE us.updated_at BETWEEN last_synced_at AND new_synced_at
    AND us.user_id = user_id_input;
END;
$$ LANGUAGE plpgsql;