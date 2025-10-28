-- get all grammars
SELECT 
  id AS grammar_id, 
  name AS grammar_name, 
  note AS grammar_note
FROM grammar
ORDER BY id ASC;

-- get all audio items
SELECT 
  audio AS filename
FROM items
GROUP BY audio
ORDER BY audio ASC;

-- get user_items for anonymous user (user_id IS NULL)
SELECT 
  i.id,
  COALESCE(ui.user_id, 0) AS user_id,
  i.czech,
  i.english,
  i.pronunciation,
  i.audio,
  ROW_NUMBER() OVER (ORDER BY b.sequence ASC, i.sequence ASC) AS sequence,
  b.grammar_id,
  COALESCE(ui.progress, 0) AS progress,
  ui.started_at,
  ui.updated_at,
  ui.next_at,
  ui.learned_at,
  ui.mastered_at
FROM items i
LEFT JOIN user_items ui 
  ON i.id = ui.item_id
LEFT JOIN blocks b
  ON i.block_id = b.id
ORDER BY b.sequence ASC, i.sequence ASC;