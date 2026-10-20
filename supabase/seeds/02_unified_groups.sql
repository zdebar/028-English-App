BEGIN;

CREATE TEMP TABLE group_seed_map (
  source_table TEXT NOT NULL,
  source_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (source_table, source_id)
) ON COMMIT DROP;

DO $$
DECLARE row_data RECORD;
DECLARE new_group_id INTEGER;
BEGIN
  FOR row_data IN
    SELECT 'topics'::TEXT AS source_table, id, 'topic'::TEXT AS type, name, note, sort_order, updated_at, deleted_at FROM seed_legacy.topics
    UNION ALL
    SELECT 'grammar_topics', id, 'grammar', name, note, sort_order, updated_at, deleted_at FROM seed_legacy.grammar_topics
    UNION ALL
    SELECT 'grammar_groups', id, 'grammar', name, note, sort_order, updated_at, deleted_at FROM seed_legacy.grammar_groups
    UNION ALL
    SELECT 'grammar_chunks', id, 'grammar', name, note, sort_order, updated_at, deleted_at FROM seed_legacy.grammar_chunks
    UNION ALL
    SELECT 'pronunciation_groups', id, 'pronunciation', name, note, sort_order, updated_at, deleted_at FROM seed_legacy.pronunciation_groups
    ORDER BY 1, 2
  LOOP
    INSERT INTO public.groups(type, name, note, sort_order, updated_at, deleted_at)
      VALUES (row_data.type, row_data.name, row_data.note, row_data.sort_order, row_data.updated_at, row_data.deleted_at)
      RETURNING id INTO new_group_id;
    INSERT INTO group_seed_map VALUES (row_data.source_table, row_data.id, new_group_id);
  END LOOP;
END $$;

INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT map.group_id, item.id,
  ROW_NUMBER() OVER (PARTITION BY map.group_id ORDER BY level.sort_order, lesson.sort_order, item.sort_order, item.id)::INTEGER,
  item.updated_at, item.deleted_at
FROM seed_legacy.items item
JOIN group_seed_map map ON map.source_table = 'topics'
  AND map.source_id = CASE WHEN item.legacy_group_id IN (1, 2, 3, 6) THEN item.legacy_group_id END
JOIN public.items ON items.id = item.id
JOIN public.lessons lesson ON lesson.id = items.lesson_id
JOIN public.levels level ON level.id = lesson.level_id
ON CONFLICT (group_id, item_id) DO NOTHING;

INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT map.group_id, example.item_id, example.sort_order, example.updated_at, example.deleted_at
FROM seed_legacy.grammar_chunk_examples example
JOIN group_seed_map map ON map.source_table = 'grammar_chunks' AND map.source_id = example.grammar_chunk_id
ON CONFLICT (group_id, item_id) DO NOTHING;

INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT map.group_id, membership.item_id, membership.sort_order, membership.updated_at, membership.deleted_at
FROM seed_legacy.pronunciation_group_items membership
JOIN group_seed_map map ON map.source_table = 'pronunciation_groups' AND map.source_id = membership.pronunciation_group_id
ON CONFLICT (group_id, item_id) DO NOTHING;

WITH RECURSIVE ipa_items AS (
  SELECT item.id AS item_id,
    regexp_replace(btrim(item.pronunciation, '/[]'), '[ˈˌː.[:space:]]+', '', 'g') AS ipa
  FROM public.items item
  WHERE item.pronunciation IS NOT NULL AND btrim(item.pronunciation) <> ''
), sound_walk(item_id, ipa, position, next_position, sound_id) AS (
  SELECT item.item_id, item.ipa, 1,
    1 + COALESCE(char_length(matched.name), 1), matched.id
  FROM ipa_items item
  LEFT JOIN LATERAL (
    SELECT sound.id, sound.name FROM public.groups sound
    WHERE sound.type = 'sound' AND sound.deleted_at IS NULL AND sound.name <> ''
      AND substr(item.ipa, 1, char_length(sound.name)) = sound.name
    ORDER BY char_length(sound.name) DESC, sound.sort_order, sound.id LIMIT 1
  ) matched ON true
  WHERE char_length(item.ipa) > 0

  UNION ALL

  SELECT walk.item_id, walk.ipa, walk.next_position,
    walk.next_position + COALESCE(char_length(matched.name), 1), matched.id
  FROM sound_walk walk
  LEFT JOIN LATERAL (
    SELECT sound.id, sound.name FROM public.groups sound
    WHERE sound.type = 'sound' AND sound.deleted_at IS NULL AND sound.name <> ''
      AND substr(walk.ipa, walk.next_position, char_length(sound.name)) = sound.name
    ORDER BY char_length(sound.name) DESC, sound.sort_order, sound.id LIMIT 1
  ) matched ON true
  WHERE walk.next_position <= char_length(walk.ipa)
), sound_item_matches AS (
  SELECT DISTINCT sound_id AS group_id, item_id FROM sound_walk WHERE sound_id IS NOT NULL
), ranked_sound_examples AS (
  SELECT matches.group_id, matches.item_id,
    ROW_NUMBER() OVER (
      PARTITION BY matches.group_id
      ORDER BY level.sort_order, lesson.sort_order, item.sort_order, item.id
    )::INTEGER AS sort_order,
    item.updated_at, item.deleted_at
  FROM sound_item_matches matches
  JOIN public.items item ON item.id = matches.item_id
  JOIN public.lessons lesson ON lesson.id = item.lesson_id
  JOIN public.levels level ON level.id = lesson.level_id
)
INSERT INTO public.group_items(group_id, item_id, sort_order, updated_at, deleted_at)
SELECT group_id, item_id, sort_order, updated_at, deleted_at
FROM ranked_sound_examples
ON CONFLICT (group_id, item_id) DO NOTHING;

INSERT INTO public.group_relations(parent_group_id, child_group_id, relation_type, sort_order, updated_at, deleted_at)
SELECT parent.group_id, child.group_id, 'hierarchy', child_row.sort_order, child_row.updated_at, child_row.deleted_at
FROM seed_legacy.grammar_groups child_row
JOIN group_seed_map parent ON parent.source_table = 'grammar_topics' AND parent.source_id = child_row.grammar_topic_id
JOIN group_seed_map child ON child.source_table = 'grammar_groups' AND child.source_id = child_row.id;

INSERT INTO public.group_relations(parent_group_id, child_group_id, relation_type, sort_order, updated_at, deleted_at)
SELECT parent.group_id, child.group_id, 'detail', child_row.sort_order, child_row.updated_at, child_row.deleted_at
FROM seed_legacy.grammar_chunks child_row
JOIN group_seed_map parent ON parent.source_table = 'grammar_groups' AND parent.source_id = child_row.grammar_group_id
JOIN group_seed_map child ON child.source_table = 'grammar_chunks' AND child.source_id = child_row.id;

INSERT INTO public.group_relations(parent_group_id, child_group_id, relation_type, sort_order)
SELECT parent.group_id, sound.id, 'contrast', sound.sort_order
FROM seed_legacy.pronunciation_groups legacy
JOIN group_seed_map parent ON parent.source_table = 'pronunciation_groups' AND parent.source_id = legacy.id
JOIN public.groups sound ON sound.type = 'sound' AND sound.deleted_at IS NULL
  AND sound.name <> '' AND POSITION(sound.name IN legacy.name) > 0
ON CONFLICT (parent_group_id, child_group_id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT item.sort_order / 1000
    FROM seed_legacy.items item
    WHERE item.grammar_chunk_id IS NOT NULL
    GROUP BY item.sort_order / 1000
    HAVING COUNT(DISTINCT item.grammar_chunk_id) > 1
  ) THEN
    RAISE EXCEPTION 'A seeded lesson maps to multiple grammar groups';
  END IF;
END $$;

UPDATE public.lessons lesson
SET group_id = map.group_id
FROM (
  SELECT DISTINCT sort_order / 1000 AS lesson_id, grammar_chunk_id
  FROM seed_legacy.items
  WHERE grammar_chunk_id IS NOT NULL
) source
JOIN group_seed_map map ON map.source_table = 'grammar_chunks' AND map.source_id = source.grammar_chunk_id
WHERE lesson.id = source.lesson_id;

COMMIT;
