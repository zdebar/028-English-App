CREATE OR REPLACE FUNCTION get_user_items(user_id_input UUID)
RETURNS TABLE (
  id INT,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  sequence INT,
  grammar_id INT,
  progress INT,
  started_at TIMESTAMP,
  updated_at TIMESTAMP,
  next_at TIMESTAMP,
  learned_at TIMESTAMP,
  mastered_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    auth.uid() AS user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    ROW_NUMBER() OVER (ORDER BY b.sequence ASC, i.sequence ASC) AS sequence,
    b.grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    ui.started_at,
    ui.updated_at,
    COALESCE(ui.next_at, '9999-12-31T23:59:59Z') AS next_at, 
    ui.learned_at, 
    COALESCE(ui.mastered_at, '9999-12-31T23:59:59Z') AS mastered_at
  FROM items i
  LEFT JOIN user_items ui 
    ON i.id = ui.item_id AND ui.user_id = auth.uid()
  LEFT JOIN blocks b
    ON i.block_id = b.id
  ORDER BY b.sequence ASC, i.sequence ASC;
END;
$$ LANGUAGE plpgsql;