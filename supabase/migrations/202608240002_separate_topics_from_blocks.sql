BEGIN;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);

CREATE TABLE public.topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT topics_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED
);

INSERT INTO public.topics (id, name, note, sort_order, updated_at, deleted_at)
SELECT id, name, note, sort_order, updated_at, deleted_at
FROM public.blocks
WHERE show_in_topics;

SELECT setval(
  pg_get_serial_sequence('public.topics', 'id'),
  COALESCE((SELECT MAX(id) FROM public.topics), 1),
  EXISTS (SELECT 1 FROM public.topics)
);

ALTER TABLE public.items
  ADD COLUMN topic_id INTEGER REFERENCES public.topics(id) ON DELETE SET NULL;

UPDATE public.items AS item
SET topic_id = item.block_id
FROM public.blocks AS block
WHERE block.id = item.block_id
  AND block.show_in_topics;

CREATE INDEX idx_items_topic_id ON public.items (topic_id);

ALTER TABLE public.blocks DROP COLUMN show_in_topics;

CREATE TRIGGER trg_set_updated_at__topics
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_vocabulary BOOLEAN,
  is_practice_item BOOLEAN,
  has_pronunciation_practice BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  topic_id INTEGER,
  grammar_chunk_id INTEGER,
  progress_cz_to_en INTEGER,
  progress_en_to_cz INTEGER,
  progress_history JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ,
  lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  RETURN QUERY
  SELECT
    item.id,
    p_user_id,
    item.czech,
    item.english,
    item.pronunciation,
    item.audio,
    item.is_vocabulary,
    block.is_practice_block,
    COALESCE(user_item.has_pronunciation_practice, FALSE),
    item.sort_order,
    ARRAY[level.sort_order, lesson.sort_order, block.sort_order, item.sort_order]::INTEGER[],
    item.note_id,
    item.block_id,
    item.topic_id,
    item.grammar_chunk_id,
    COALESCE(user_item.progress_cz_to_en, 0),
    COALESCE(user_item.progress_en_to_cz, 0),
    '[]'::JSONB,
    user_item.started_at,
    COALESCE(user_item.updated_at, item.updated_at),
    item.deleted_at,
    user_item.next_at_cz_to_en,
    user_item.next_at_en_to_cz,
    user_item.mastered_at_cz_to_en,
    user_item.mastered_at_en_to_cz,
    block.lesson_id
  FROM public.items AS item
  JOIN public.blocks AS block ON block.id = item.block_id
  JOIN public.lessons AS lesson ON lesson.id = block.lesson_id
  JOIN public.levels AS level ON level.id = lesson.level_id
  LEFT JOIN public.user_items AS user_item
    ON user_item.item_id = item.id AND user_item.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(user_item.updated_at, public.rpc_min_timestamptz()),
      item.updated_at,
      block.updated_at,
      lesson.updated_at,
      level.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

CREATE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  item_id INTEGER,
  user_id UUID,
  czech TEXT,
  english TEXT,
  pronunciation TEXT,
  audio TEXT,
  is_vocabulary BOOLEAN,
  is_practice_item BOOLEAN,
  has_pronunciation_practice BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  topic_id INTEGER,
  grammar_chunk_id INTEGER,
  progress_cz_to_en INTEGER,
  progress_en_to_cz INTEGER,
  progress_history JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ,
  lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_history_enabled BOOLEAN := FALSE;
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_user_items, '[]'::JSONB)) entry
    WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
  ) THEN
    RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
  END IF;

  SELECT COALESCE(history_enabled, FALSE)
  INTO v_history_enabled
  FROM public.users
  WHERE id = p_user_id;

  PERFORM public.upsert_user_items(
    COALESCE(p_user_items, '[]'::JSONB),
    v_history_enabled
  );

  RETURN QUERY
  SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;

CREATE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  lesson_id INTEGER,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  is_practice_block BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  RETURN QUERY
  SELECT
    p_user_id,
    block.id,
    block.name,
    block.note,
    block.lesson_id,
    block.grammar_chunk_id,
    block.sort_order,
    block.is_practice_block,
    user_block.started_at,
    GREATEST(COALESCE(user_block.updated_at, public.rpc_min_timestamptz()), block.updated_at),
    block.deleted_at
  FROM public.blocks AS block
  LEFT JOIN public.user_blocks AS user_block
    ON user_block.block_id = block.id AND user_block.user_id = p_user_id
  WHERE GREATEST(COALESCE(user_block.updated_at, public.rpc_min_timestamptz()), block.updated_at)
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY block.sort_order, block.id;
END;
$$;

CREATE FUNCTION public.upsert_fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_blocks JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  lesson_id INTEGER,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  is_practice_block BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_blocks IS NOT NULL AND p_user_blocks <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_blocks) entry
      WHERE (entry->>private.json_key_user_id())::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_blocks';
    END IF;

    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;

  RETURN QUERY
  SELECT * FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE ALL PRIVILEGES ON TABLE public.topics FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.topics TO authenticated;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalog_select_authenticated ON public.topics
  FOR SELECT TO authenticated
  USING (TRUE);

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;

COMMIT;
