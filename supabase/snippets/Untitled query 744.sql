TRUNCATE TABLE lessons RESTART IDENTITY CASCADE where type = 'grammar';

INSERT INTO public.group_items (
  group_id,
  item_id,
  sort_order
)
SELECT
  49,
  item_id,
  ROW_NUMBER() OVER (ORDER BY item_id)
FROM generate_series(345, 352) AS item_id;