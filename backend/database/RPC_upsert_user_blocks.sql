CREATE OR REPLACE FUNCTION public.upsert_user_blocks(
  p_user_blocks JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_block_id INT;
  v_progress INT;
  v_is_vocabulary BOOLEAN;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at TIMESTAMPTZ;
  v_mastered_at TIMESTAMPTZ;
  v_row_count INT := 0;
  v_upserted_count INT := 0;
  v_skipped_count INT := 0;
  v_error_count INT := 0;
BEGIN
  IF p_user_blocks IS NULL OR p_user_blocks = '[]'::JSONB THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_blocks) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      v_block_id := (v_entry->>'block_id')::INT;
      IF NOT EXISTS (SELECT 1 FROM public.blocks WHERE id = v_block_id) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress := GREATEST((v_entry->>'progress')::INT, 0);
      v_is_vocabulary := COALESCE((v_entry->>'is_vocabulary')::BOOLEAN, FALSE);
      v_started_at := NULLIF(v_entry->>'started_at', 'null')::TIMESTAMPTZ;
      v_updated_at := (v_entry->>'updated_at')::TIMESTAMPTZ;
      v_next_at := NULLIF(v_entry->>'next_at', 'null')::TIMESTAMPTZ;
      v_mastered_at := NULLIF(v_entry->>'mastered_at', 'null')::TIMESTAMPTZ;

      INSERT INTO public.user_blocks (
        user_id,
        block_id,
        progress,
        is_vocabulary,
        started_at,
        updated_at,
        next_at,
        mastered_at
      )
      VALUES (
        v_user_id,
        v_block_id,
        v_progress,
        v_is_vocabulary,
        v_started_at,
        v_updated_at,
        v_next_at,
        v_mastered_at
      )
      ON CONFLICT (user_id, block_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        is_vocabulary = EXCLUDED.is_vocabulary,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at = EXCLUDED.next_at,
        mastered_at = EXCLUDED.mastered_at
      WHERE COALESCE(EXCLUDED.updated_at, '-infinity'::timestamptz)
        >= COALESCE(public.user_blocks.updated_at, '-infinity'::timestamptz);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_upserted_count := v_upserted_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_count := v_skipped_count + 1;
        v_error_count := v_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_blocks: upserted=%, skipped=%, errors=%',
    v_upserted_count,
    v_skipped_count,
    v_error_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_blocks(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_blocks(JSONB) TO authenticated;
