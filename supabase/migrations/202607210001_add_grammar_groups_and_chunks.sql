CREATE TABLE IF NOT EXISTS public.grammar_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT,
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.grammar RENAME TO grammar_chunks;
ALTER SEQUENCE IF EXISTS public.grammar_id_seq RENAME TO grammar_chunks_id_seq;
ALTER TABLE public.grammar_chunks
  ADD COLUMN IF NOT EXISTS grammar_group_id INTEGER
  REFERENCES public.grammar_groups(id) ON DELETE SET NULL;

ALTER TABLE public.blocks RENAME COLUMN grammar_id TO grammar_chunk_id;
DROP INDEX IF EXISTS public.idx_blocks_grammar_id;
CREATE INDEX IF NOT EXISTS idx_blocks_grammar_chunk_id
  ON public.blocks (grammar_chunk_id);
CREATE INDEX IF NOT EXISTS idx_grammar_chunks_group_id
  ON public.grammar_chunks (grammar_group_id, sort_order);

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar ON public.grammar_chunks;
CREATE TRIGGER trg_set_updated_at__grammar_chunks
BEFORE UPDATE ON public.grammar_chunks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_set_updated_at__grammar_groups
BEFORE UPDATE ON public.grammar_groups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL PRIVILEGES ON TABLE public.grammar_groups FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.grammar_groups TO authenticated;
ALTER TABLE public.grammar_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalog_select_authenticated ON public.grammar_groups
  FOR SELECT TO authenticated USING (TRUE);

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);

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
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
  grammar_chunk_id INTEGER,
  progress INTEGER,
  progress_history JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT
    i.id, p_user_id, i.czech, i.english, i.pronunciation, i.audio,
    (b.grammar_chunk_id IS NULL), b.is_practice_block, i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, b.sort_order, i.sort_order]::INTEGER[],
    i.note_id, i.block_id, b.grammar_chunk_id,
    COALESCE(ui.progress, 0), '[]'::JSONB, ui.started_at,
    COALESCE(ui.updated_at, i.updated_at), i.deleted_at, ui.next_at,
    ui.mastered_at, b.lesson_id
  FROM public.items i
  JOIN public.blocks b ON b.id = i.block_id
  JOIN public.lessons le ON le.id = b.lesson_id
  JOIN public.levels lv ON lv.id = le.level_id
  LEFT JOIN public.user_items ui ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(
    COALESCE(ui.updated_at, public.rpc_min_timestamptz()),
    i.updated_at, b.updated_at, le.updated_at, lv.updated_at
  ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

CREATE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, english TEXT, pronunciation TEXT,
  audio TEXT, is_vocabulary BOOLEAN, is_practice_item BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, block_id INTEGER,
  grammar_chunk_id INTEGER, progress INTEGER, progress_history JSONB,
  started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ, mastered_at TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_history_enabled BOOLEAN := FALSE;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  SELECT COALESCE(u.history_enabled, FALSE) INTO v_history_enabled
    FROM public.users u WHERE u.id = p_user_id;
  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_items) entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;
  RETURN QUERY SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);

CREATE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID, block_id INTEGER, name TEXT, note TEXT, lesson_id INTEGER,
  grammar_chunk_id INTEGER, sort_order INTEGER, progress INTEGER,
  is_vocabulary BOOLEAN, show_in_topics BOOLEAN, is_practice_block BOOLEAN,
  started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT
    p_user_id, b.id, b.name, b.note, b.lesson_id, b.grammar_chunk_id,
    b.sort_order, COALESCE(ub.progress, 0), (b.grammar_chunk_id IS NULL),
    b.show_in_topics, b.is_practice_block, ub.started_at,
    GREATEST(COALESCE(ub.updated_at, public.rpc_min_timestamptz()), b.updated_at),
    ub.next_at, ub.mastered_at, b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub ON ub.block_id = b.id AND ub.user_id = p_user_id
  WHERE GREATEST(
    COALESCE(ub.updated_at, public.rpc_min_timestamptz()), b.updated_at
  ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC;
END;
$$;

CREATE FUNCTION public.upsert_fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_blocks JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID, block_id INTEGER, name TEXT, note TEXT, lesson_id INTEGER,
  grammar_chunk_id INTEGER, sort_order INTEGER, progress INTEGER,
  is_vocabulary BOOLEAN, show_in_topics BOOLEAN, is_practice_block BOOLEAN,
  started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_blocks IS NOT NULL AND p_user_blocks <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_blocks) entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_blocks';
    END IF;
    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;
  RETURN QUERY SELECT * FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
