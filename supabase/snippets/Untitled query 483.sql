SELECT count(*)
FROM items
WHERE lesson_id = 2;

INSERT INTO public.group_items (
  group_id,
  item_id,
  sort_order
)
SELECT
  1,
  item_id,
  ROW_NUMBER() OVER (ORDER BY item_id)
FROM generate_series(81, 88) AS item_id;