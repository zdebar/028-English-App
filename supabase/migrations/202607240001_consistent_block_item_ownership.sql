DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);

ALTER TABLE public.items
  ADD COLUMN lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE RESTRICT,
  ADD COLUMN grammar_chunk_id INTEGER REFERENCES public.grammar_chunks(id) ON DELETE RESTRICT,
  ADD COLUMN is_vocabulary BOOLEAN;

UPDATE public.items i
SET
  lesson_id = b.lesson_id,
  grammar_chunk_id = b.grammar_chunk_id,
  is_vocabulary = (b.grammar_chunk_id IS NULL)
FROM public.blocks b
WHERE b.id = i.block_id;

-- Item ordering was previously scoped to a block, so multiple blocks in the
-- same lesson can contain the same sort_order. Flatten those block-local
-- positions into one deterministic lesson-wide sequence before enforcing the
-- new lesson-scoped unique constraint.
WITH ordered AS (
  SELECT
    i.id,
    ROW_NUMBER() OVER (
      PARTITION BY i.lesson_id
      ORDER BY b.sort_order, i.sort_order, i.id
    )::INTEGER AS position
  FROM public.items i
  JOIN public.blocks b ON b.id = i.block_id
)
UPDATE public.items AS target
SET sort_order = ordered.position
FROM ordered
WHERE target.id = ordered.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.items
    GROUP BY lesson_id, sort_order
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'items.sort_order must be unique within each lesson';
  END IF;
END;
$$;

ALTER TABLE public.items
  ALTER COLUMN lesson_id SET NOT NULL,
  ALTER COLUMN is_vocabulary SET NOT NULL,
  ALTER COLUMN block_id DROP NOT NULL,
  DROP CONSTRAINT items_block_sort_order_key,
  ADD CONSTRAINT items_lesson_sort_order_key
    UNIQUE (lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.blocks
  RENAME COLUMN is_practice_block TO is_removed_from_practice;

ALTER TABLE public.blocks
  ALTER COLUMN sort_order DROP NOT NULL,
  DROP CONSTRAINT blocks_lesson_sort_order_key;

UPDATE public.blocks
SET is_removed_from_practice = NOT is_removed_from_practice;

ALTER TABLE public.blocks
  ALTER COLUMN is_removed_from_practice SET DEFAULT FALSE;

UPDATE public.blocks
SET sort_order = NULL;

UPDATE public.items i
SET block_id = NULL
FROM public.blocks b
WHERE b.id = i.block_id
  AND b.show_in_topics = FALSE
  AND b.requires_initial_training = FALSE
  AND b.is_removed_from_practice = TRUE;

DELETE FROM public.blocks b
WHERE b.show_in_topics = FALSE
  AND b.requires_initial_training = FALSE
  AND b.is_removed_from_practice = TRUE;

ALTER TABLE public.blocks
  DROP COLUMN lesson_id,
  ADD CONSTRAINT blocks_sort_order_key UNIQUE (sort_order)
    DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT blocks_training_not_removed_from_practice_check
    CHECK (requires_initial_training = FALSE OR is_removed_from_practice = FALSE);

CREATE INDEX IF NOT EXISTS idx_items_lesson_id
  ON public.items (lesson_id);
CREATE INDEX IF NOT EXISTS idx_items_grammar_chunk_id
  ON public.items (grammar_chunk_id);

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
    i.id,
    p_user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    i.is_vocabulary,
    COALESCE(NOT b.is_removed_from_practice, TRUE),
    i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, i.sort_order]::INTEGER[],
    i.note_id,
    i.block_id,
    i.grammar_chunk_id,
    COALESCE(ui.progress, 0),
    '[]'::JSONB,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at),
    i.deleted_at,
    ui.next_at,
    ui.mastered_at,
    i.lesson_id
  FROM public.items i
  LEFT JOIN public.blocks b ON b.id = i.block_id
  JOIN public.lessons le ON le.id = i.lesson_id
  JOIN public.levels lv ON lv.id = le.level_id
  LEFT JOIN public.user_items ui
    ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ui.updated_at, public.rpc_min_timestamptz()),
      i.updated_at,
      COALESCE(b.updated_at, public.rpc_min_timestamptz()),
      le.updated_at,
      lv.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;

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
  is_removed_from_practice BOOLEAN,
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
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_history_enabled BOOLEAN := FALSE;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  SELECT COALESCE(u.history_enabled, FALSE)
    INTO v_history_enabled
    FROM public.users u
   WHERE u.id = p_user_id;

  IF p_user_items IS NOT NULL AND p_user_items <> v_empty_json THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_items) entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;

  RETURN QUERY SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) TO authenticated;

CREATE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  show_in_topics BOOLEAN,
  is_practice_item BOOLEAN,
  requires_initial_training BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
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
    b.id,
    b.name,
    b.note,
    b.grammar_chunk_id,
    b.sort_order,
    COALESCE(ub.progress, 0),
    b.show_in_topics,
    b.is_removed_from_practice,
    b.requires_initial_training,
    ub.started_at,
    GREATEST(COALESCE(ub.updated_at, public.rpc_min_timestamptz()), b.updated_at),
    ub.next_at,
    ub.mastered_at,
    b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub
    ON ub.block_id = b.id AND ub.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC NULLS LAST, b.id ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;

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
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  show_in_topics BOOLEAN,
  is_removed_from_practice BOOLEAN,
  requires_initial_training BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_blocks IS NOT NULL AND p_user_blocks <> v_empty_json THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_blocks) entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_blocks';
    END IF;
    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;

  RETURN QUERY SELECT * FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
