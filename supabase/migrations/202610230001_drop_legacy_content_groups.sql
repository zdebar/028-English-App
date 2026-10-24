BEGIN;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

DO $$
DECLARE
  expected_groups BIGINT;
  mapped_groups BIGINT;
BEGIN
  SELECT
    (SELECT count(*) FROM public.topics) +
    (SELECT count(*) FROM public.grammar_topics) +
    (SELECT count(*) FROM public.grammar_groups) +
    (SELECT count(*) FROM public.grammar_chunks) +
    (SELECT count(*) FROM public.pronunciation_groups)
  INTO expected_groups;
  SELECT count(*) INTO mapped_groups FROM public.group_legacy_ids;
  IF expected_groups <> mapped_groups THEN
    RAISE EXCEPTION 'Unified group migration is incomplete: % source groups, % mappings', expected_groups, mapped_groups;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.items item
    WHERE item.topic_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.group_legacy_ids mapping
        JOIN public.group_items membership ON membership.group_id = mapping.group_id
        WHERE mapping.source_table = 'topics'
          AND mapping.source_id = item.topic_id
          AND membership.item_id = item.id
      )
  ) THEN
    RAISE EXCEPTION 'Unified topic memberships are incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.grammar_chunk_examples source
    LEFT JOIN public.group_legacy_ids mapping
      ON mapping.source_table = 'grammar_chunks' AND mapping.source_id = source.grammar_chunk_id
    LEFT JOIN public.group_items membership
      ON membership.group_id = mapping.group_id AND membership.item_id = source.item_id
    WHERE mapping.group_id IS NULL OR membership.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unified grammar examples are incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pronunciation_group_items source
    LEFT JOIN public.group_legacy_ids mapping
      ON mapping.source_table = 'pronunciation_groups' AND mapping.source_id = source.pronunciation_group_id
    LEFT JOIN public.group_items membership
      ON membership.group_id = mapping.group_id AND membership.item_id = source.item_id
    WHERE mapping.group_id IS NULL OR membership.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unified pronunciation examples are incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.grammar_groups source
    LEFT JOIN public.group_legacy_ids parent
      ON parent.source_table = 'grammar_topics' AND parent.source_id = source.grammar_topic_id
    LEFT JOIN public.group_legacy_ids child
      ON child.source_table = 'grammar_groups' AND child.source_id = source.id
    LEFT JOIN public.group_relations mapped_relation
      ON mapped_relation.parent_group_id = parent.group_id
      AND mapped_relation.child_group_id = child.group_id
      AND mapped_relation.relation_type = 'hierarchy'
    WHERE parent.group_id IS NULL OR child.group_id IS NULL OR mapped_relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unified grammar topic hierarchy is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.grammar_chunks source
    LEFT JOIN public.group_legacy_ids parent
      ON parent.source_table = 'grammar_groups' AND parent.source_id = source.grammar_group_id
    LEFT JOIN public.group_legacy_ids child
      ON child.source_table = 'grammar_chunks' AND child.source_id = source.id
    LEFT JOIN public.group_relations mapped_relation
      ON mapped_relation.parent_group_id = parent.group_id
      AND mapped_relation.child_group_id = child.group_id
      AND mapped_relation.relation_type = 'detail'
    WHERE parent.group_id IS NULL OR child.group_id IS NULL OR mapped_relation.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unified grammar chunk hierarchy is incomplete';
  END IF;

  UPDATE public.lessons lesson
  SET group_id = mapping.group_id
  FROM public.group_legacy_ids mapping
  WHERE mapping.source_table = 'grammar_chunks'
    AND mapping.source_id = lesson.grammar_chunk_id
    AND lesson.group_id IS DISTINCT FROM mapping.group_id;
END;
$$;

ALTER TABLE public.items DROP COLUMN topic_id;
ALTER TABLE public.items DROP COLUMN grammar_chunk_id;
ALTER TABLE public.lessons DROP COLUMN grammar_chunk_id;

DROP TABLE public.pronunciation_group_items;
DROP TABLE public.grammar_chunk_examples;
DROP TABLE public.grammar_chunks;
DROP TABLE public.grammar_groups;
DROP TABLE public.grammar_topics;
DROP TABLE public.pronunciation_groups;
DROP TABLE public.topics;
DROP TABLE public.group_legacy_ids;

CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, czech_description TEXT, english TEXT,
  pronunciation TEXT, audio TEXT, is_vocabulary BOOLEAN,
  is_cz_to_en_enabled BOOLEAN, is_en_to_cz_enabled BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, progress_cz_to_en INTEGER,
  progress_en_to_cz INTEGER, started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ, next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ, mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT i.id, p_user_id, i.czech, i.czech_description, i.english, i.pronunciation,
    i.audio, i.is_vocabulary, i.is_cz_to_en_enabled, i.is_en_to_cz_enabled, i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, i.sort_order]::INTEGER[], i.note_id,
    COALESCE(ui.progress_cz_to_en, 0), COALESCE(ui.progress_en_to_cz, 0), ui.started_at,
    COALESCE(ui.updated_at, i.updated_at), i.deleted_at, ui.next_at_cz_to_en,
    ui.next_at_en_to_cz, ui.mastered_at_cz_to_en, ui.mastered_at_en_to_cz, i.lesson_id
  FROM public.items i
  JOIN public.lessons le ON le.id = i.lesson_id
  JOIN public.levels lv ON lv.id = le.level_id
  LEFT JOIN public.user_items ui ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at, le.updated_at, lv.updated_at)
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
    AND (p_sync_until IS NULL OR GREATEST(COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at, le.updated_at, lv.updated_at) <= p_sync_until);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, czech_description TEXT, english TEXT,
  pronunciation TEXT, audio TEXT, is_vocabulary BOOLEAN,
  is_cz_to_en_enabled BOOLEAN, is_en_to_cz_enabled BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, progress_cz_to_en INTEGER,
  progress_en_to_cz INTEGER, started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ, next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ, mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_items IS NOT NULL AND p_user_items <> v_empty_json THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items);
  END IF;
  RETURN QUERY SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at, p_sync_until);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ) TO authenticated;

COMMIT;
