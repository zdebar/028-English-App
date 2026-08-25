DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_user_blocks(JSONB);
DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES public.lessons(id) ON DELETE RESTRICT;

UPDATE public.items AS item
SET lesson_id = block.lesson_id
FROM public.blocks AS block
WHERE block.id = item.block_id
  AND item.lesson_id IS NULL;

DO $$
DECLARE
  v_missing_ids TEXT;
BEGIN
  SELECT string_agg(id::TEXT, ', ' ORDER BY id)
  INTO v_missing_ids
  FROM public.items
  WHERE lesson_id IS NULL
    AND deleted_at IS NULL;

  IF v_missing_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot derive lesson_id for active items: %', v_missing_ids;
  END IF;
END;
$$;

-- Preserve legacy completed-block state before user_blocks disappears.
INSERT INTO public.user_items (
  user_id,
  item_id,
  progress_cz_to_en,
  progress_en_to_cz,
  started_at,
  updated_at,
  next_at_cz_to_en,
  next_at_en_to_cz
)
SELECT
  user_block.user_id,
  item.id,
  2,
  2,
  user_block.started_at,
  user_block.updated_at,
  user_block.started_at,
  user_block.started_at
FROM public.user_blocks AS user_block
JOIN public.items AS item ON item.block_id = user_block.block_id
WHERE user_block.started_at IS NOT NULL
ON CONFLICT (user_id, item_id) DO UPDATE
SET progress_cz_to_en = GREATEST(public.user_items.progress_cz_to_en, 2),
    progress_en_to_cz = GREATEST(public.user_items.progress_en_to_cz, 2),
    started_at = COALESCE(public.user_items.started_at, EXCLUDED.started_at),
    updated_at = GREATEST(public.user_items.updated_at, EXCLUDED.updated_at),
    next_at_cz_to_en = COALESCE(public.user_items.next_at_cz_to_en, EXCLUDED.next_at_cz_to_en),
    next_at_en_to_cz = COALESCE(public.user_items.next_at_en_to_cz, EXCLUDED.next_at_en_to_cz);

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_block_sort_order_key,
  DROP CONSTRAINT IF EXISTS items_block_id_fkey;

ALTER TABLE public.items
  ALTER COLUMN block_id DROP NOT NULL,
  ALTER COLUMN lesson_id SET NOT NULL;

DROP TRIGGER IF EXISTS trg_require_item_block_lesson ON public.items;
DROP TRIGGER IF EXISTS trg_prevent_nonempty_block_lesson_clear ON public.blocks;
DROP FUNCTION IF EXISTS public.require_item_block_lesson();
DROP FUNCTION IF EXISTS public.prevent_nonempty_block_lesson_clear();

-- Only blocks with an introductory grammar chunk remain explicit.
UPDATE public.items AS item
SET block_id = NULL
FROM public.blocks AS block
WHERE block.id = item.block_id
  AND block.grammar_chunk_id IS NULL;

DELETE FROM public.blocks
WHERE grammar_chunk_id IS NULL;

UPDATE public.blocks AS block
SET lesson_id = source.lesson_id
FROM (
  SELECT block_id, MIN(lesson_id) AS lesson_id
  FROM public.items
  WHERE block_id IS NOT NULL
  GROUP BY block_id
) AS source
WHERE source.block_id = block.id
  AND block.lesson_id IS NULL;

DO $$
DECLARE
  v_invalid_blocks TEXT;
BEGIN
  SELECT string_agg(id::TEXT, ', ' ORDER BY id)
  INTO v_invalid_blocks
  FROM public.blocks
  WHERE lesson_id IS NULL;

  IF v_invalid_blocks IS NOT NULL THEN
    RAISE EXCEPTION 'Explicit blocks require lesson_id: %', v_invalid_blocks;
  END IF;

  SELECT string_agg(block_id::TEXT, ', ' ORDER BY block_id)
  INTO v_invalid_blocks
  FROM (
    SELECT block_id
    FROM public.items
    WHERE block_id IS NOT NULL
    GROUP BY block_id
    HAVING COUNT(DISTINCT lesson_id) > 1
  ) AS mixed;

  IF v_invalid_blocks IS NOT NULL THEN
    RAISE EXCEPTION 'Explicit blocks contain items from multiple lessons: %', v_invalid_blocks;
  END IF;

  SELECT string_agg(block_id::TEXT, ', ' ORDER BY block_id)
  INTO v_invalid_blocks
  FROM (
    SELECT member.block_id
    FROM public.items AS member
    JOIN (
      SELECT block_id, lesson_id, MIN(sort_order) AS min_sort, MAX(sort_order) AS max_sort,
             COUNT(*) AS member_count
      FROM public.items
      WHERE block_id IS NOT NULL
      GROUP BY block_id, lesson_id
    ) AS bounds ON bounds.block_id = member.block_id
    JOIN public.items AS ranged
      ON ranged.lesson_id = bounds.lesson_id
     AND ranged.sort_order BETWEEN bounds.min_sort AND bounds.max_sort
    GROUP BY member.block_id, bounds.member_count
    HAVING COUNT(DISTINCT ranged.id) <> bounds.member_count
  ) AS noncontiguous;

  IF v_invalid_blocks IS NOT NULL THEN
    RAISE EXCEPTION 'Explicit block items are not contiguous: %', v_invalid_blocks;
  END IF;
END;
$$;

ALTER TABLE public.blocks
  DROP CONSTRAINT IF EXISTS blocks_sort_order_key,
  DROP CONSTRAINT IF EXISTS blocks_id_lesson_id_key,
  DROP COLUMN IF EXISTS sort_order,
  DROP COLUMN IF EXISTS is_practice_block,
  ALTER COLUMN lesson_id SET NOT NULL,
  ADD CONSTRAINT blocks_id_lesson_id_key UNIQUE (id, lesson_id);

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_lesson_sort_order_key,
  ADD CONSTRAINT items_lesson_sort_order_key
    UNIQUE (lesson_id, sort_order) DEFERRABLE INITIALLY DEFERRED,
  ADD CONSTRAINT items_block_lesson_fkey
    FOREIGN KEY (block_id, lesson_id)
    REFERENCES public.blocks(id, lesson_id) ON DELETE RESTRICT;

DROP TRIGGER IF EXISTS trg_require_item_block_lesson ON public.items;
DROP TRIGGER IF EXISTS trg_prevent_nonempty_block_lesson_clear ON public.blocks;
DROP FUNCTION IF EXISTS public.require_item_block_lesson();
DROP FUNCTION IF EXISTS public.prevent_nonempty_block_lesson_clear();

CREATE OR REPLACE FUNCTION public.validate_explicit_block_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_block_id INTEGER;
  v_block_ids INTEGER[];
  v_lesson_count INTEGER;
  v_lesson_id INTEGER;
  v_member_count INTEGER;
  v_range_count INTEGER;
  v_min_sort INTEGER;
  v_max_sort INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_block_ids := ARRAY[NEW.block_id];
  ELSIF TG_OP = 'DELETE' THEN
    v_block_ids := ARRAY[OLD.block_id];
  ELSE
    v_block_ids := ARRAY[OLD.block_id, NEW.block_id];
  END IF;

  FOREACH v_block_id IN ARRAY v_block_ids LOOP
    IF v_block_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT COUNT(DISTINCT lesson_id), MIN(lesson_id), MIN(sort_order), MAX(sort_order), COUNT(*)
      INTO v_lesson_count, v_lesson_id, v_min_sort, v_max_sort, v_member_count
    FROM public.items
    WHERE block_id = v_block_id;

    IF v_member_count = 0 THEN
      CONTINUE;
    END IF;
    IF v_lesson_count <> 1 THEN
      RAISE EXCEPTION 'Explicit block % contains items from multiple lessons', v_block_id;
    END IF;

    SELECT COUNT(*) INTO v_range_count
    FROM public.items
    WHERE lesson_id = v_lesson_id
      AND sort_order BETWEEN v_min_sort AND v_max_sort;

    IF v_range_count <> v_member_count THEN
      RAISE EXCEPTION 'Explicit block % items are not contiguous in lesson %', v_block_id, v_lesson_id;
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_validate_explicit_block_items
AFTER INSERT OR DELETE OR UPDATE OF block_id, lesson_id, sort_order ON public.items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.validate_explicit_block_items();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_blocks ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_delete_own_non_demo ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_insert_own_non_demo ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_select_own ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_update_own_non_demo ON public.user_blocks;
DROP TABLE public.user_blocks;

CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, english TEXT, pronunciation TEXT, audio TEXT,
  is_vocabulary BOOLEAN, has_pronunciation_practice BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, block_id INTEGER, topic_id INTEGER,
  grammar_chunk_id INTEGER, progress_cz_to_en INTEGER, progress_en_to_cz INTEGER,
  progress_history JSONB, started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ, next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ, mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT i.id, p_user_id, i.czech, i.english, i.pronunciation, i.audio,
    i.is_vocabulary, COALESCE(ui.has_pronunciation_practice, FALSE), i.sort_order,
    ARRAY[level.sort_order, lesson.sort_order, i.sort_order]::INTEGER[],
    i.note_id, i.block_id, i.topic_id, i.grammar_chunk_id,
    COALESCE(ui.progress_cz_to_en, 0), COALESCE(ui.progress_en_to_cz, 0),
    '[]'::JSONB, ui.started_at, COALESCE(ui.updated_at, i.updated_at), i.deleted_at,
    ui.next_at_cz_to_en, ui.next_at_en_to_cz, ui.mastered_at_cz_to_en,
    ui.mastered_at_en_to_cz, i.lesson_id
  FROM public.items AS i
  JOIN public.lessons AS lesson ON lesson.id = i.lesson_id
  JOIN public.levels AS level ON level.id = lesson.level_id
  LEFT JOIN public.user_items AS ui ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at,
    lesson.updated_at, level.updated_at)
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, english TEXT, pronunciation TEXT, audio TEXT,
  is_vocabulary BOOLEAN, has_pronunciation_practice BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, block_id INTEGER, topic_id INTEGER,
  grammar_chunk_id INTEGER, progress_cz_to_en INTEGER, progress_en_to_cz INTEGER,
  progress_history JSONB, started_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ, next_at_en_to_cz TIMESTAMPTZ,
  mastered_at_cz_to_en TIMESTAMPTZ, mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_history_enabled BOOLEAN := FALSE;
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  SELECT COALESCE(history_enabled, FALSE) INTO v_history_enabled
  FROM public.users WHERE id = p_user_id;
  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>private.json_key_user_id())::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;
  RETURN QUERY SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
