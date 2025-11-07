CREATE OR REPLACE FUNCTION get_user_items(user_id_input UUID)
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
  next_at TIMESTAMPTZ,
  learned_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ
) 
SET search_path = public, pg_catalog
AS $$
BEGIN
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
    COALESCE(ui.next_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS next_at, 
    COALESCE(ui.learned_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS learned_at,
    COALESCE(ui.mastered_at, '9999-12-31T23:59:59Z')::TIMESTAMPTZ AS mastered_at
  FROM public.items i 
  LEFT JOIN public.user_items ui 
    ON i.id = ui.item_id AND ui.user_id = auth.uid()
  LEFT JOIN public.blocks b
    ON i.block_id = b.id
  ORDER BY b.sequence ASC, i.sequence ASC;
END;
$$ LANGUAGE plpgsql;

