SELECT id, czech, english
FROM public.items
WHERE block_id IS NULL
ORDER BY lesson_id, sort_order, id;

SELECT id, name
FROM public.blocks
WHERE is_removed_from_practice = FALSE
  AND sort_order IS NULL
ORDER BY id;

SELECT user_id, COUNT(*) AS user_item_count
FROM public.user_items
GROUP BY user_id
ORDER BY user_id;

SELECT user_id, COUNT(*) AS user_block_count
FROM public.user_blocks
GROUP BY user_id
ORDER BY user_id;
