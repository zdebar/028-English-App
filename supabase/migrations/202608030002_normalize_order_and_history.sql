ALTER TABLE public.grammar_groups
  DROP CONSTRAINT IF EXISTS grammar_groups_sort_order_key,
  ADD CONSTRAINT grammar_groups_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.grammar_chunks
  DROP CONSTRAINT IF EXISTS grammar_sort_order_key,
  DROP CONSTRAINT IF EXISTS grammar_chunks_sort_order_key,
  ADD CONSTRAINT grammar_chunks_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.levels
  DROP CONSTRAINT IF EXISTS levels_sort_order_key,
  ADD CONSTRAINT levels_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.notes
  DROP CONSTRAINT IF EXISTS notes_sort_order_key,
  ADD CONSTRAINT notes_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_sort_order_check,
  ADD CONSTRAINT items_sort_order_check CHECK (sort_order >= 1);

ALTER TABLE public.pronunciation_groups
  DROP CONSTRAINT IF EXISTS pronunciation_groups_sort_order_key,
  ADD CONSTRAINT pronunciation_groups_sort_order_key
    UNIQUE (sort_order) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE public.user_items_history
  ALTER COLUMN direction DROP DEFAULT,
  ALTER COLUMN outcome DROP DEFAULT,
  DROP CONSTRAINT IF EXISTS user_items_history_direction_check,
  DROP CONSTRAINT IF EXISTS user_items_history_outcome_check,
  ADD CONSTRAINT user_items_history_direction_check
    CHECK (direction IN ('czToEn', 'enToCz')),
  ADD CONSTRAINT user_items_history_outcome_check
    CHECK (outcome IN ('correct', 'incorrect', 'skip'));

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
  v_user_id UUID;
  v_item_id INT;
  v_progress_cz_to_en INT;
  v_progress_en_to_cz INT;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at_cz_to_en TIMESTAMPTZ;
  v_next_at_en_to_cz TIMESTAMPTZ;
  v_mastered_at_cz_to_en TIMESTAMPTZ;
  v_mastered_at_en_to_cz TIMESTAMPTZ;
  v_requested_pronunciation BOOLEAN;
  v_eligible_pronunciation BOOLEAN;
  v_row_count INT := 0;
  v_main_error_count INT := 0;
  -- constants to avoid duplicated literals
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_item_id_re CONSTANT TEXT := '^[0-9]+$';
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_key_item_id CONSTANT TEXT := 'item_id';
  v_key_progress_cz_to_en CONSTANT TEXT := 'progress_cz_to_en';
  v_key_progress_en_to_cz CONSTANT TEXT := 'progress_en_to_cz';
  v_key_pronunciation_practice CONSTANT TEXT := 'has_pronunciation_practice';
  v_key_progress CONSTANT TEXT := 'progress';
  v_key_started_at CONSTANT TEXT := 'started_at';
  v_key_updated_at CONSTANT TEXT := private.json_key_updated_at();
  v_key_next_at_cz_to_en CONSTANT TEXT := 'next_at_cz_to_en';
  v_key_next_at_en_to_cz CONSTANT TEXT := 'next_at_en_to_cz';
  v_key_mastered_at_cz_to_en CONSTANT TEXT := 'mastered_at_cz_to_en';
  v_key_mastered_at_en_to_cz CONSTANT TEXT := 'mastered_at_en_to_cz';
  v_key_progress_history CONSTANT TEXT := 'progress_history';
  v_key_created_at CONSTANT TEXT := 'created_at';
  v_key_direction CONSTANT TEXT := 'direction';
  v_key_outcome CONSTANT TEXT := 'outcome';
  v_total_count INT := 0;
  v_matched_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  IF p_user_items IS NULL OR p_user_items = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    v_total_count := v_total_count + 1;
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_item_id := (v_entry->>v_key_item_id)::INT;

      SELECT
        COALESCE(i.is_vocabulary, FALSE)
          AND NULLIF(BTRIM(i.audio), '') IS NOT NULL
      INTO v_eligible_pronunciation
      FROM public.items i
      WHERE i.id = v_item_id;

      -- Skip entries for items that no longer exist (avoid FK errors).
      IF NOT FOUND THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress_cz_to_en := GREATEST((v_entry->>v_key_progress_cz_to_en)::INT, 0);
      v_progress_en_to_cz := GREATEST((v_entry->>v_key_progress_en_to_cz)::INT, 0);
      v_requested_pronunciation := CASE
        WHEN v_entry ? v_key_pronunciation_practice
          THEN COALESCE(
            (v_entry->>v_key_pronunciation_practice)::BOOLEAN,
            FALSE
          )
        ELSE FALSE
      END;
      v_started_at := NULLIF(v_entry->>v_key_started_at, v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;
      v_next_at_cz_to_en := NULLIF(v_entry->>v_key_next_at_cz_to_en, v_null_text)::TIMESTAMPTZ;
      v_next_at_en_to_cz := NULLIF(v_entry->>v_key_next_at_en_to_cz, v_null_text)::TIMESTAMPTZ;
      v_mastered_at_cz_to_en := NULLIF(v_entry->>v_key_mastered_at_cz_to_en, v_null_text)::TIMESTAMPTZ;
      v_mastered_at_en_to_cz := NULLIF(v_entry->>v_key_mastered_at_en_to_cz, v_null_text)::TIMESTAMPTZ;

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
        v_progress_cz_to_en,
        v_progress_en_to_cz,
        v_requested_pronunciation AND v_eligible_pronunciation,
        v_started_at,
        v_updated_at,
        v_next_at_cz_to_en,
        v_next_at_en_to_cz,
        v_mastered_at_cz_to_en,
        v_mastered_at_en_to_cz
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

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_matched_count := v_matched_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_count := v_skipped_count + 1;
        v_main_error_count := v_main_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_items: incoming=% upserted=% skipped=% errors=%',
    v_total_count,
    v_matched_count,
    v_skipped_count,
    v_main_error_count;

  IF NOT COALESCE(p_history_enabled, FALSE) THEN
    RAISE LOG 'user_items_history: inserted=0, skipped_invalid=0, skipped_existing=0, skipped_disabled=1, errors=0';
    RETURN;
  END IF;

  -- Best-effort insert of progress history: validate created_at, skip invalid rows.
  -- Do not make history insertion fatal for the whole upsert operation.
  DECLARE
    v_entry jsonb;
    v_hist jsonb;
    v_item_id INT;
    v_hist_user_id UUID;
    v_progress INT;
    v_direction TEXT;
    v_outcome TEXT;
    v_created_at timestamptz;
    v_inserted_count INT := 0;
    v_skipped_invalid INT := 0;
    v_error_count INT := 0;
    v_skipped_existing INT := 0;
  BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
      BEGIN
        v_hist_user_id := (v_entry->>v_key_user_id)::UUID;
        PERFORM public.assert_payload_user_id_matches_auth(v_hist_user_id, v_auth_user_id);

        -- skip entries without numeric item_id
        IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
          CONTINUE;
        END IF;
        v_item_id := (v_entry->>v_key_item_id)::INT;

        -- skip history for items that no longer exist (avoid FK errors)
        IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
          CONTINUE;
        END IF;
        FOR v_hist IN SELECT * FROM jsonb_array_elements(COALESCE(v_entry->v_key_progress_history, v_empty_json)) LOOP
          BEGIN
            -- validate and parse created_at; if invalid, skip this hist entry
            IF (v_hist->>v_key_created_at) IS NULL THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END IF;
            BEGIN
              v_created_at := (v_hist->>v_key_created_at)::timestamptz;
            EXCEPTION WHEN others THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END;

            v_progress := (v_hist->>v_key_progress)::INT;
            v_direction := NULLIF(v_hist->>v_key_direction, v_null_text);
            IF v_direction IS NULL OR v_direction NOT IN ('czToEn', 'enToCz') THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END IF;
            v_outcome := NULLIF(v_hist->>v_key_outcome, v_null_text);
            IF v_outcome IS NULL OR v_outcome NOT IN ('correct', 'incorrect', 'skip') THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END IF;

            -- Insert if not exists (avoid duplicates). Use ON CONFLICT DO NOTHING if unique constraint added.
            BEGIN
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
                v_hist_user_id,
                v_progress,
                v_direction,
                v_outcome,
                v_created_at
              )
              ON CONFLICT DO NOTHING;
              IF FOUND THEN
                v_inserted_count := v_inserted_count + 1;
              ELSE
                v_skipped_existing := v_skipped_existing + 1;
              END IF;
            EXCEPTION WHEN others THEN
              v_error_count := v_error_count + 1;
              -- continue with next history item
            END;
          END;
        END LOOP;
      EXCEPTION
        WHEN insufficient_privilege THEN
          RAISE;
        WHEN others THEN
          v_skipped_invalid := v_skipped_invalid + 1;
          v_error_count := v_error_count + 1;
          CONTINUE;
      END;
    END LOOP;

    -- Log result so operator can be aware when items were skipped/failed.
    RAISE LOG 'user_items_history: inserted=%, skipped_invalid=%, skipped_existing=%, skipped_disabled=0, errors=%', v_inserted_count, v_skipped_invalid, v_skipped_existing, v_error_count;
  END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) TO authenticated;


