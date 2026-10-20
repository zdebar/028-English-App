BEGIN;

CREATE TEMP TABLE group_seed_map (
  source_table TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (source_table, source_id)
) ON COMMIT DROP;

INSERT INTO public.user_lessons(user_id, lesson_id, started_at)
SELECT user_item.user_id, item.lesson_id,
  MIN(COALESCE(user_item.started_at, user_item.mastered_at_cz_to_en))
FROM public.user_items user_item
JOIN public.items item ON item.id = user_item.item_id
WHERE COALESCE(user_item.started_at, user_item.mastered_at_cz_to_en) IS NOT NULL
GROUP BY user_item.user_id, item.lesson_id
ON CONFLICT (user_id, lesson_id, started_at) DO NOTHING;

DO $$
DECLARE row_data RECORD;
DECLARE new_group_id INTEGER;
BEGIN
  FOR row_data IN
    SELECT 'topics'::TEXT AS source_table, id, 'topic'::TEXT AS type, name, note, sort_order, updated_at, deleted_at FROM public.topics
    UNION ALL
    SELECT 'grammar_topics', id, 'grammar', name, note, sort_order, updated_at, deleted_at FROM public.grammar_topics
    UNION ALL
    SELECT 'grammar_groups', id, 'grammar', name, note, sort_order, updated_at, deleted_at FROM public.grammar_groups
    UNION ALL
    SELECT 'grammar_chunks', id, 'grammar', name, note, sort_order, updated_at, deleted_at FROM public.grammar_chunks
    UNION ALL
    SELECT 'pronunciation_groups', id, 'pronunciation', name, note, sort_order, updated_at, deleted_at FROM public.pronunciation_groups
    ORDER BY 1, 2
  LOOP
    INSERT INTO public.groups(type, name, note, sort_order, updated_at, deleted_at)
      VALUES (row_data.type, row_data.name, row_data.note, row_data.sort_order, row_data.updated_at, row_data.deleted_at)
      RETURNING id INTO new_group_id;
    INSERT INTO group_seed_map VALUES (row_data.source_table, row_data.id, new_group_id);
    INSERT INTO public.group_legacy_ids VALUES (row_data.source_table, row_data.id, new_group_id);
  END LOOP;
END $$;

INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT map.group_id, item.id,
  ROW_NUMBER() OVER (
    PARTITION BY map.group_id
    ORDER BY level.sort_order, lesson.sort_order, item.sort_order, item.id
  )::INTEGER,
  item.updated_at, item.deleted_at
FROM public.items item
JOIN group_seed_map map ON map.source_table = 'topics' AND map.source_id = item.topic_id
JOIN public.lessons lesson ON lesson.id = item.lesson_id
JOIN public.levels level ON level.id = lesson.level_id
ON CONFLICT (group_id, item_id) DO NOTHING;

INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT map.group_id, example.item_id, example.sort_order, example.updated_at, example.deleted_at
FROM public.grammar_chunk_examples example
JOIN group_seed_map map ON map.source_table = 'grammar_chunks' AND map.source_id = example.grammar_chunk_id
ON CONFLICT (group_id, item_id) DO NOTHING;

INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT map.group_id, membership.item_id, membership.sort_order, membership.updated_at, membership.deleted_at
FROM public.pronunciation_group_items membership
JOIN group_seed_map map ON map.source_table = 'pronunciation_groups' AND map.source_id = membership.pronunciation_group_id
ON CONFLICT (group_id, item_id) DO NOTHING;

INSERT INTO public.group_relations(parent_group_id, child_group_id, relation_type, sort_order, updated_at, deleted_at)
SELECT parent.group_id, child.group_id, 'hierarchy', child_row.sort_order, child_row.updated_at, child_row.deleted_at
FROM public.grammar_groups child_row
JOIN group_seed_map parent ON parent.source_table = 'grammar_topics' AND parent.source_id = child_row.grammar_topic_id
JOIN group_seed_map child ON child.source_table = 'grammar_groups' AND child.source_id = child_row.id;

INSERT INTO public.group_relations(parent_group_id, child_group_id, relation_type, sort_order, updated_at, deleted_at)
SELECT parent.group_id, child.group_id, 'detail', child_row.sort_order, child_row.updated_at, child_row.deleted_at
FROM public.grammar_chunks child_row
JOIN group_seed_map parent ON parent.source_table = 'grammar_groups' AND parent.source_id = child_row.grammar_group_id
JOIN group_seed_map child ON child.source_table = 'grammar_chunks' AND child.source_id = child_row.id;

UPDATE public.lessons lesson
SET group_id = map.group_id
FROM group_seed_map map
WHERE map.source_table = 'grammar_chunks' AND map.source_id = lesson.grammar_chunk_id;

COMMIT;
