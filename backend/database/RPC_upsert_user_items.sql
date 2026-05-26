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
  v_progress INT;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at TIMESTAMPTZ;
  v_mastered_at TIMESTAMPTZ;
  v_row_count INT := 0;
  v_main_error_count INT := 0;
  -- constants to avoid duplicated literals
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_item_id_re CONSTANT TEXT := '^[0-9]+$';
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_key_item_id CONSTANT TEXT := 'item_id';
  v_total_count INT := 0;
  v_matched_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  IF p_user_items IS NULL OR p_user_items = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    v_total_count := v_total_count + 1;
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      IF v_user_id IS DISTINCT FROM v_auth_user_id THEN
        RAISE EXCEPTION USING
          ERRCODE = '42501',
          MESSAGE = 'Payload user_id must match auth.uid()';
      END IF;

      IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_item_id := (v_entry->>v_key_item_id)::INT;

      -- skip entries for items that no longer exist (avoid FK errors)
      IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress := GREATEST((v_entry->>'progress')::INT, 0);
      v_started_at := NULLIF(v_entry->>'started_at', v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>'updated_at')::TIMESTAMPTZ;
      v_next_at := (v_entry->>'next_at')::TIMESTAMPTZ;
      v_mastered_at := (v_entry->>'mastered_at')::TIMESTAMPTZ;

      INSERT INTO public.user_items (
        user_id,
        item_id,
        progress,
        started_at,
        updated_at,
        next_at,
        mastered_at
      )
      VALUES (
        v_user_id,
        v_item_id,
        v_progress,
        v_started_at,
        v_updated_at,
        v_next_at,
        v_mastered_at
      )
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at = EXCLUDED.next_at,
        mastered_at = EXCLUDED.mastered_at
      WHERE COALESCE(EXCLUDED.updated_at, '-infinity'::timestamptz)
        >= COALESCE(public.user_items.updated_at, '-infinity'::timestamptz);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_matched_count := v_matched_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN SQLSTATE '42501' THEN
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
    v_created_at timestamptz;
    v_inserted_count INT := 0;
    v_skipped_invalid INT := 0;
    v_error_count INT := 0;
    v_skipped_existing INT := 0;
  BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
      BEGIN
        v_hist_user_id := (v_entry->>v_key_user_id)::UUID;
        IF v_hist_user_id IS DISTINCT FROM v_auth_user_id THEN
          RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Payload user_id must match auth.uid()';
        END IF;

        -- skip entries without numeric item_id
        IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
          CONTINUE;
        END IF;
        v_item_id := (v_entry->>v_key_item_id)::INT;

        -- skip history for items that no longer exist (avoid FK errors)
        IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
          CONTINUE;
        END IF;
        FOR v_hist IN SELECT * FROM jsonb_array_elements(COALESCE(v_entry->'progress_history', v_empty_json)) LOOP
          BEGIN
            -- validate and parse created_at; if invalid, skip this hist entry
            IF (v_hist->>'created_at') IS NULL THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END IF;
            BEGIN
              v_created_at := (v_hist->>'created_at')::timestamptz;
            EXCEPTION WHEN others THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END;

            v_progress := (v_hist->>'progress')::INT;

            -- Insert if not exists (avoid duplicates). Use ON CONFLICT DO NOTHING if unique constraint added.
            BEGIN
              INSERT INTO public.user_items_history (item_id, user_id, progress, created_at)
              VALUES (v_item_id, v_hist_user_id, v_progress, v_created_at)
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
        WHEN SQLSTATE '42501' THEN
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

REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) TO authenticated;