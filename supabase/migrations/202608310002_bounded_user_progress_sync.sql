-- Keep user-owned synchronization inside the timestamp window that is stored
-- in local metadata. The lower bound is exclusive and the upper bound is
-- inclusive, so a successful sync can advance metadata without replaying the
-- row at the previous boundary or missing a row changed during the sync.

DROP FUNCTION IF EXISTS public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_items(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_fetch_user_item_progress_history(UUID, TIMESTAMPTZ, JSONB);

CREATE OR REPLACE FUNCTION public.fetch_user_items(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  item_id INTEGER, user_id UUID, czech TEXT, english TEXT, pronunciation TEXT,
  audio TEXT, is_vocabulary BOOLEAN, has_pronunciation_practice BOOLEAN,
  sort_order INTEGER, curriculum_sort_path INTEGER[], note_id INTEGER,
  block_id INTEGER, topic_id INTEGER, grammar_chunk_id INTEGER,
  progress_cz_to_en INTEGER, progress_en_to_cz INTEGER, started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ, mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT i.id, p_user_id, i.czech, i.english, i.pronunciation, i.audio,
    i.is_vocabulary, COALESCE(ui.has_pronunciation_practice, FALSE), i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, i.sort_order]::INTEGER[], i.note_id,
    i.block_id, i.topic_id, i.grammar_chunk_id,
    COALESCE(ui.progress_cz_to_en, 0), COALESCE(ui.progress_en_to_cz, 0),
    ui.started_at, COALESCE(ui.updated_at, i.updated_at), i.deleted_at,
    ui.next_at_cz_to_en, ui.next_at_en_to_cz, ui.mastered_at_cz_to_en,
    ui.mastered_at_en_to_cz, i.lesson_id
  FROM public.items AS i
  JOIN public.lessons AS le ON le.id = i.lesson_id
  JOIN public.levels AS lv ON lv.id = le.level_id
  LEFT JOIN public.user_items AS ui
    ON ui.item_id = i.id AND ui.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at,
      le.updated_at, lv.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
    AND (
      p_sync_until IS NULL
      OR GREATEST(
        COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at,
        le.updated_at, lv.updated_at
      ) <= p_sync_until
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_items(p_user_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_item_id INTEGER;
  v_updated_at TIMESTAMPTZ;
BEGIN
  IF p_user_items IS NULL OR p_user_items = '[]'::JSONB THEN RETURN; END IF;
  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);
      v_item_id := (v_entry->>'item_id')::INTEGER;
      v_updated_at := (v_entry->>'updated_at')::TIMESTAMPTZ;
      IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN CONTINUE; END IF;

      INSERT INTO public.user_items (
        user_id, item_id, progress_cz_to_en, progress_en_to_cz,
        has_pronunciation_practice, started_at, updated_at,
        next_at_cz_to_en, next_at_en_to_cz, mastered_at_cz_to_en, mastered_at_en_to_cz
      )
      VALUES (
        v_user_id, v_item_id,
        GREATEST((v_entry->>'progress_cz_to_en')::INTEGER, 0),
        GREATEST((v_entry->>'progress_en_to_cz')::INTEGER, 0),
        COALESCE((v_entry->>'has_pronunciation_practice')::BOOLEAN, FALSE),
        NULLIF(v_entry->>'started_at', 'null')::TIMESTAMPTZ, v_updated_at,
        NULLIF(v_entry->>'next_at_cz_to_en', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'next_at_en_to_cz', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'mastered_at_cz_to_en', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'mastered_at_en_to_cz', 'null')::TIMESTAMPTZ
      )
      ON CONFLICT (user_id, item_id) DO UPDATE SET
        progress_cz_to_en = EXCLUDED.progress_cz_to_en,
        progress_en_to_cz = EXCLUDED.progress_en_to_cz,
        has_pronunciation_practice = EXCLUDED.has_pronunciation_practice,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at_cz_to_en = EXCLUDED.next_at_cz_to_en,
        next_at_en_to_cz = EXCLUDED.next_at_en_to_cz,
        mastered_at_cz_to_en = EXCLUDED.mastered_at_cz_to_en,
        mastered_at_en_to_cz = EXCLUDED.mastered_at_en_to_cz
      WHERE EXCLUDED.updated_at > public.user_items.updated_at;
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE;
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
  item_id INTEGER, user_id UUID, czech TEXT, english TEXT, pronunciation TEXT,
  audio TEXT, is_vocabulary BOOLEAN, has_pronunciation_practice BOOLEAN,
  sort_order INTEGER, curriculum_sort_path INTEGER[], note_id INTEGER,
  block_id INTEGER, topic_id INTEGER, grammar_chunk_id INTEGER,
  progress_cz_to_en INTEGER, progress_en_to_cz INTEGER, started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ, next_at_cz_to_en TIMESTAMPTZ,
  next_at_en_to_cz TIMESTAMPTZ, mastered_at_cz_to_en TIMESTAMPTZ,
  mastered_at_en_to_cz TIMESTAMPTZ, lesson_id INTEGER
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items);
  END IF;
  RETURN QUERY SELECT *
  FROM public.fetch_user_items(p_user_id, p_last_synced_at, p_sync_until);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_user_item_progress_history(
  p_user_item_progress_history JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
BEGIN
  IF p_user_item_progress_history IS NULL
     OR p_user_item_progress_history = '[]'::JSONB THEN RETURN; END IF;
  v_auth_user_id := public.require_auth_user_id();
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_item_progress_history) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);
      IF (v_entry->>'item_id')::INTEGER < 0
         OR (v_entry->>'progress')::INTEGER < 0
         OR (v_entry->>'max_progress')::INTEGER < 0
         OR v_entry->>'direction' NOT IN ('czToEn', 'enToCz') THEN CONTINUE; END IF;

      INSERT INTO public.user_item_progress_history (
        user_id, date, item_id, direction, progress, max_progress,
        progress_change, updated_at, deleted_at
      )
      VALUES (
        v_user_id, (v_entry->>'date')::DATE, (v_entry->>'item_id')::INTEGER,
        v_entry->>'direction', (v_entry->>'progress')::INTEGER,
        (v_entry->>'max_progress')::INTEGER, (v_entry->>'progress_change')::INTEGER,
        (v_entry->>'updated_at')::TIMESTAMPTZ,
        NULLIF(v_entry->>'deleted_at', 'null')::TIMESTAMPTZ
      )
      ON CONFLICT (user_id, date, item_id, direction) DO UPDATE SET
        progress = EXCLUDED.progress,
        max_progress = EXCLUDED.max_progress,
        progress_change = EXCLUDED.progress_change,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
      WHERE EXCLUDED.updated_at > public.user_item_progress_history.updated_at;
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE;
      WHEN others THEN CONTINUE;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_item_progress_history(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_item_progress_history JSONB DEFAULT '[]'::JSONB,
  p_sync_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID, date DATE, item_id INTEGER, direction TEXT, progress INTEGER,
  max_progress INTEGER, progress_change INTEGER, updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_item_progress_history IS NOT NULL
     AND p_user_item_progress_history <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_item_progress_history) AS entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION
        'p_user_id does not match at least one user_id in p_user_item_progress_history';
    END IF;
    PERFORM public.upsert_user_item_progress_history(p_user_item_progress_history);
  END IF;
  RETURN QUERY
  SELECT h.user_id, h.date, h.item_id, h.direction, h.progress, h.max_progress,
    h.progress_change, h.updated_at, h.deleted_at
  FROM public.user_item_progress_history AS h
  WHERE h.user_id = p_user_id
    AND h.updated_at > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
    AND (p_sync_until IS NULL OR h.updated_at <= p_sync_until)
  ORDER BY h.date, h.item_id, h.direction;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_item_progress_history(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_item_progress_history(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
) TO authenticated;
