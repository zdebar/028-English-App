CREATE OR REPLACE FUNCTION public.upsert_user_items(
  p_user_items JSONB
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
  v_key_started_at CONSTANT TEXT := 'started_at';
  v_key_updated_at CONSTANT TEXT := private.json_key_updated_at();
  v_key_next_at_cz_to_en CONSTANT TEXT := 'next_at_cz_to_en';
  v_key_next_at_en_to_cz CONSTANT TEXT := 'next_at_en_to_cz';
  v_key_mastered_at_cz_to_en CONSTANT TEXT := 'mastered_at_cz_to_en';
  v_key_mastered_at_en_to_cz CONSTANT TEXT := 'mastered_at_en_to_cz';
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
        NULLIF(BTRIM(i.audio), '') IS NOT NULL
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
        > COALESCE(public.user_items.updated_at, public.rpc_min_timestamptz());

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

END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB) TO authenticated;
