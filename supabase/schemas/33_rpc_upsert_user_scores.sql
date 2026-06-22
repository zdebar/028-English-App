CREATE OR REPLACE FUNCTION public.upsert_user_scores(
  p_user_scores JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_date DATE;
  v_item_count INTEGER;
  v_updated_at TIMESTAMPTZ;
  v_upserted_count INT := 0;
  v_skipped_invalid INT := 0;
  v_error_count INT := 0;
  v_row_count INT := 0;
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_key_date CONSTANT TEXT := 'date';
  v_key_item_count CONSTANT TEXT := 'item_count';
  v_key_updated_at CONSTANT TEXT := 'updated_at';
BEGIN
  IF p_user_scores IS NULL OR p_user_scores = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_scores) LOOP
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      v_date := (v_entry->>v_key_date)::DATE;
      v_item_count := GREATEST((v_entry->>v_key_item_count)::INTEGER, 0);
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;

      INSERT INTO public.user_scores (user_id, date, item_count, updated_at)
      VALUES (v_user_id, v_date, v_item_count, v_updated_at)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        item_count = GREATEST(public.user_scores.item_count, EXCLUDED.item_count),
        updated_at = GREATEST(public.user_scores.updated_at, EXCLUDED.updated_at);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_upserted_count := v_upserted_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_invalid := v_skipped_invalid + 1;
        v_error_count := v_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_scores: upserted=%, skipped_invalid=%, errors=%',
    v_upserted_count,
    v_skipped_invalid,
    v_error_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) TO authenticated;
