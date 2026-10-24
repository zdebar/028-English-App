WITH pronunciation_sound_links AS (
  SELECT pronunciation.id AS parent_group_id, sound.id AS child_group_id,
    ROW_NUMBER() OVER (
      PARTITION BY pronunciation.id ORDER BY sound.sort_order, sound.id
    )::INTEGER AS sort_order
  FROM public.groups pronunciation
  JOIN public.groups sound
    ON sound.type = 'sound'
    AND sound.deleted_at IS NULL
    AND sound.name <> ''
    AND strpos(pronunciation.name, sound.name) > 0
  WHERE pronunciation.type = 'pronunciation'
    AND pronunciation.deleted_at IS NULL
)
INSERT INTO public.group_relations(parent_group_id, child_group_id, relation_type, sort_order)
SELECT parent_group_id, child_group_id, 'contrast', sort_order
FROM pronunciation_sound_links
ON CONFLICT (parent_group_id, child_group_id) DO NOTHING;

WITH RECURSIVE ipa_items AS (
  SELECT item.id AS item_id,
    regexp_replace(btrim(item.pronunciation, '/[]'), '[ˈˌː.[:space:]]+', '', 'g') AS ipa
  FROM public.items item
  WHERE item.pronunciation IS NOT NULL AND btrim(item.pronunciation) <> ''
), sound_walk(item_id, ipa, char_offset, next_position, sound_id) AS (
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
