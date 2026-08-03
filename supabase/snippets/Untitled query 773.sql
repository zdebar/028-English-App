INSERT INTO public.grammar_chunk_examples (
  grammar_chunk_id,
  item_id,
  sort_order
)
SELECT
  1,
  item_id,
  item_id - 40
FROM generate_series(41, 48) AS item_id;