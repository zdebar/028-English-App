SELECT count(*)
FROM items
WHERE lesson_id = 2;

INSERT INTO public.group_items (
  group_id,
  item_id,
  sort_order
)
SELECT
  60,
  item_id,
  ROW_NUMBER() OVER (ORDER BY item_id)
FROM generate_series(345, 352) AS item_id;

INSERT INTO public.group_items (
  group_id,
  item_id,
  sort_order
)
SELECT
  groups.group_id,
  (groups.group_id - 1) * 8 + positions.sort_order AS item_id,
  positions.sort_order
FROM generate_series(1, 41) AS groups(group_id)
CROSS JOIN generate_series(1, 8) AS positions(sort_order);