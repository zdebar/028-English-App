BEGIN;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_user_items(JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

ALTER TABLE public.items
  ADD COLUMN is_cz_to_en_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN is_en_to_cz_enabled BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE public.items SET updated_at = NOW();

ALTER TABLE public.user_items
  ADD COLUMN progress_en_to_cz INTEGER NOT NULL DEFAULT 0 CHECK (progress_en_to_cz >= 0),
  ADD COLUMN next_at_en_to_cz TIMESTAMPTZ,
  ADD COLUMN mastered_at_en_to_cz TIMESTAMPTZ;

UPDATE public.user_items
SET progress_en_to_cz = 0,
    next_at_en_to_cz = NOW(),
    mastered_at_en_to_cz = NULL,
    updated_at = NOW()
WHERE started_at IS NOT NULL
   OR mastered_at_cz_to_en IS NOT NULL;

DROP INDEX IF EXISTS public.idx_user_items_user_updated_item;
DROP INDEX IF EXISTS public.idx_user_items_item_user;
CREATE INDEX idx_user_items_user_updated_item
  ON public.user_items (user_id, updated_at, item_id)
  INCLUDE (progress_cz_to_en, progress_en_to_cz, started_at,
    next_at_cz_to_en, next_at_en_to_cz, mastered_at_cz_to_en, mastered_at_en_to_cz);
CREATE INDEX idx_user_items_item_user
  ON public.user_items (item_id, user_id)
  INCLUDE (progress_cz_to_en, progress_en_to_cz, started_at, updated_at,
    next_at_cz_to_en, next_at_en_to_cz, mastered_at_cz_to_en, mastered_at_en_to_cz);

-- Recreate the RPCs with directional progress fields while preserving authenticated-only access.
CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, czech_description TEXT, english TEXT,
  pronunciation TEXT, audio TEXT, is_vocabulary BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, block_id INTEGER, topic_id INTEGER,
  grammar_chunk_id INTEGER, progress_cz_to_en INTEGER, progress_en_to_cz INTEGER,
  is_cz_to_en_enabled BOOLEAN, is_en_to_cz_enabled BOOLEAN, started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ, mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql SET search_path TO public AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT i.id, p_user_id, i.czech, i.czech_description, i.english, i.pronunciation,
    i.audio, i.is_vocabulary, i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, i.sort_order]::INTEGER[], i.note_id,
    i.block_id, i.topic_id, i.grammar_chunk_id, COALESCE(ui.progress_cz_to_en, 0),
    COALESCE(ui.progress_en_to_cz, 0), i.is_cz_to_en_enabled, i.is_en_to_cz_enabled,
    ui.started_at, COALESCE(ui.updated_at, i.updated_at), i.deleted_at,
    ui.next_at_cz_to_en, ui.next_at_en_to_cz, ui.mastered_at_cz_to_en,
    ui.mastered_at_en_to_cz, i.lesson_id
  FROM public.items i
  JOIN public.lessons le ON le.id = i.lesson_id
  JOIN public.levels lv ON lv.id = le.level_id
  LEFT JOIN public.user_items ui ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at,
      le.updated_at, lv.updated_at) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
    AND (p_sync_until IS NULL OR GREATEST(COALESCE(ui.updated_at,
      public.rpc_min_timestamptz()), i.updated_at, le.updated_at, lv.updated_at) <= p_sync_until);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_items(p_user_items JSONB)
RETURNS VOID LANGUAGE plpgsql SET search_path TO public AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_item_id INTEGER;
BEGIN
  IF p_user_items IS NULL OR p_user_items = '[]'::JSONB THEN RETURN; END IF;
  v_auth_user_id := public.require_auth_user_id();
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);
      IF NOT COALESCE(v_entry->>'item_id', '') ~ '^[0-9]+$' THEN CONTINUE; END IF;
      v_item_id := (v_entry->>'item_id')::INTEGER;
      IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN CONTINUE; END IF;
      INSERT INTO public.user_items (
        user_id, item_id, progress_cz_to_en, progress_en_to_cz, started_at, updated_at,
        next_at_cz_to_en, next_at_en_to_cz, mastered_at_cz_to_en, mastered_at_en_to_cz
      ) VALUES (
        v_user_id, v_item_id,
        GREATEST((v_entry->>'progress_cz_to_en')::INTEGER, 0),
        GREATEST((v_entry->>'progress_en_to_cz')::INTEGER, 0),
        NULLIF(v_entry->>'started_at', 'null')::TIMESTAMPTZ,
        (v_entry->>'updated_at')::TIMESTAMPTZ,
        NULLIF(v_entry->>'next_at_cz_to_en', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'next_at_en_to_cz', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'mastered_at_cz_to_en', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'mastered_at_en_to_cz', 'null')::TIMESTAMPTZ
      ) ON CONFLICT (user_id, item_id) DO UPDATE SET
        progress_cz_to_en = EXCLUDED.progress_cz_to_en,
        progress_en_to_cz = EXCLUDED.progress_en_to_cz,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at_cz_to_en = EXCLUDED.next_at_cz_to_en,
        next_at_en_to_cz = EXCLUDED.next_at_en_to_cz,
        mastered_at_cz_to_en = EXCLUDED.mastered_at_cz_to_en,
        mastered_at_en_to_cz = EXCLUDED.mastered_at_en_to_cz
      WHERE COALESCE(EXCLUDED.updated_at, public.rpc_min_timestamptz()) >
        COALESCE(public.user_items.updated_at, public.rpc_min_timestamptz());
    EXCEPTION WHEN insufficient_privilege THEN RAISE;
      WHEN others THEN CONTINUE;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_items JSONB DEFAULT '[]'::JSONB,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, czech_description TEXT, english TEXT,
  pronunciation TEXT, audio TEXT, is_vocabulary BOOLEAN, sort_order INTEGER,
  curriculum_sort_path INTEGER[], note_id INTEGER, block_id INTEGER, topic_id INTEGER,
  grammar_chunk_id INTEGER, progress_cz_to_en INTEGER, progress_en_to_cz INTEGER,
  is_cz_to_en_enabled BOOLEAN, is_en_to_cz_enabled BOOLEAN, started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ, mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql SET search_path TO public AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_user_items) entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items);
  END IF;
  RETURN QUERY SELECT * FROM public.fetch_user_items(p_user_id, p_last_synced_at, p_sync_until);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ) TO authenticated;

COMMIT;
