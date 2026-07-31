CREATE TABLE public.pronunciation_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL UNIQUE CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE public.pronunciation_group_items (
  pronunciation_group_id INTEGER NOT NULL
    REFERENCES public.pronunciation_groups(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  PRIMARY KEY (pronunciation_group_id, item_id),
  UNIQUE (pronunciation_group_id, sort_order)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_pronunciation_group_items_item_id
  ON public.pronunciation_group_items (item_id);

CREATE TRIGGER trg_set_updated_at__pronunciation_groups
BEFORE UPDATE ON public.pronunciation_groups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_set_updated_at__pronunciation_group_items
BEFORE UPDATE ON public.pronunciation_group_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL PRIVILEGES ON TABLE
  public.pronunciation_groups,
  public.pronunciation_group_items
FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE
  public.pronunciation_groups,
  public.pronunciation_group_items
TO authenticated;

ALTER TABLE public.pronunciation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronunciation_group_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY catalog_select_authenticated ON public.pronunciation_groups
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY catalog_select_authenticated ON public.pronunciation_group_items
  FOR SELECT TO authenticated USING (TRUE);

ALTER TABLE public.user_items
  ADD COLUMN has_pronunciation_practice BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_user_items_user_pronunciation_practice
  ON public.user_items (user_id, has_pronunciation_practice);

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
  has_pronunciation_practice BOOLEAN,
  sort_order INTEGER,
  curriculum_sort_path INTEGER[],
  note_id INTEGER,
  block_id INTEGER,
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
    i.id,
    p_user_id,
    i.czech,
    i.english,
    i.pronunciation,
    i.audio,
    i.is_vocabulary,
    COALESCE(NOT b.is_removed_from_practice, TRUE),
    COALESCE(ui.has_pronunciation_practice, FALSE),
    i.sort_order,
    ARRAY[lv.sort_order, le.sort_order, i.sort_order]::INTEGER[],
    i.note_id,
    i.block_id,
    i.grammar_chunk_id,
    COALESCE(ui.progress_cz_to_en, 0),
    COALESCE(ui.progress_en_to_cz, 0),
    '[]'::JSONB,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at),
    i.deleted_at,
    ui.next_at_cz_to_en,
    ui.next_at_en_to_cz,
    ui.mastered_at_cz_to_en,
    ui.mastered_at_en_to_cz,
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

CREATE OR REPLACE FUNCTION public.upsert_user_items(
  p_user_items JSONB,
  p_history_enabled BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_history JSONB;
  v_user_id UUID;
  v_item_id INTEGER;
  v_direction TEXT;
  v_outcome TEXT;
  v_requested_pronunciation BOOLEAN;
  v_eligible_pronunciation BOOLEAN;
  v_key_pronunciation_practice CONSTANT TEXT := 'has_pronunciation_practice';
  v_legacy_value CONSTANT TEXT := 'legacy';
BEGIN
  IF p_user_items IS NULL OR p_user_items = '[]'::JSONB THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      IF NOT COALESCE(v_entry->>'item_id', '') ~ '^[0-9]+$' THEN
        CONTINUE;
      END IF;
      v_item_id := (v_entry->>'item_id')::INTEGER;

      SELECT
        COALESCE(i.is_vocabulary, FALSE)
          AND NULLIF(BTRIM(i.audio), '') IS NOT NULL
      INTO v_eligible_pronunciation
      FROM public.items i
      WHERE i.id = v_item_id;
      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      v_requested_pronunciation := CASE
        WHEN v_entry ? v_key_pronunciation_practice
          THEN COALESCE((v_entry->>v_key_pronunciation_practice)::BOOLEAN, FALSE)
        ELSE FALSE
      END;

      INSERT INTO public.user_items (
        user_id,
        item_id,
        progress_cz_to_en,
        progress_en_to_cz,
        has_pronunciation_practice,
        started_at,
        updated_at,
        next_at_cz_to_en,
        next_at_en_to_cz,
        mastered_at_cz_to_en,
        mastered_at_en_to_cz
      )
      VALUES (
        v_user_id,
        v_item_id,
        GREATEST((v_entry->>'progress_cz_to_en')::INTEGER, 0),
        GREATEST((v_entry->>'progress_en_to_cz')::INTEGER, 0),
        v_requested_pronunciation AND v_eligible_pronunciation,
        NULLIF(v_entry->>'started_at', 'null')::TIMESTAMPTZ,
        (v_entry->>'updated_at')::TIMESTAMPTZ,
        NULLIF(v_entry->>'next_at_cz_to_en', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'next_at_en_to_cz', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'mastered_at_cz_to_en', 'null')::TIMESTAMPTZ,
        NULLIF(v_entry->>'mastered_at_en_to_cz', 'null')::TIMESTAMPTZ
      )
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET
        progress_cz_to_en = EXCLUDED.progress_cz_to_en,
        progress_en_to_cz = EXCLUDED.progress_en_to_cz,
        has_pronunciation_practice = CASE
          WHEN v_entry ? v_key_pronunciation_practice
            THEN EXCLUDED.has_pronunciation_practice
          ELSE public.user_items.has_pronunciation_practice
        END,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at_cz_to_en = EXCLUDED.next_at_cz_to_en,
        next_at_en_to_cz = EXCLUDED.next_at_en_to_cz,
        mastered_at_cz_to_en = EXCLUDED.mastered_at_cz_to_en,
        mastered_at_en_to_cz = EXCLUDED.mastered_at_en_to_cz
      WHERE COALESCE(EXCLUDED.updated_at, public.rpc_min_timestamptz())
        >= COALESCE(public.user_items.updated_at, public.rpc_min_timestamptz());

      IF COALESCE(p_history_enabled, FALSE) THEN
        FOR v_history IN
          SELECT * FROM jsonb_array_elements(
            COALESCE(v_entry->'progress_history', '[]'::JSONB)
          )
        LOOP
          BEGIN
            v_direction := COALESCE(
              NULLIF(v_history->>'direction', 'null'),
              v_legacy_value
            );
            IF v_direction NOT IN ('czToEn', 'enToCz', v_legacy_value) THEN
              CONTINUE;
            END IF;
            v_outcome := COALESCE(
              NULLIF(v_history->>'outcome', 'null'),
              v_legacy_value
            );
            IF v_outcome NOT IN ('correct', 'incorrect', 'skip', v_legacy_value) THEN
              CONTINUE;
            END IF;
            INSERT INTO public.user_items_history (
              item_id,
              user_id,
              progress,
              direction,
              outcome,
              created_at
            )
            VALUES (
              v_item_id,
              v_user_id,
              GREATEST((v_history->>'progress')::INTEGER, 0),
              v_direction,
              v_outcome,
              (v_history->>'created_at')::TIMESTAMPTZ
            )
            ON CONFLICT DO NOTHING;
          EXCEPTION WHEN others THEN
            CONTINUE;
          END;
        END LOOP;
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE;
      WHEN others THEN CONTINUE;
    END;
  END LOOP;
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

REVOKE EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN)
  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_items(UUID, TIMESTAMPTZ)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_items(UUID, TIMESTAMPTZ, JSONB)
  TO authenticated;
