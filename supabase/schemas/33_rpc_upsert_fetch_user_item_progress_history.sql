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
  v_item_id INTEGER;
  v_date DATE;
  v_direction TEXT;
  v_progress INTEGER;
  v_max_progress INTEGER;
  v_progress_change INTEGER;
  v_updated_at TIMESTAMPTZ;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  IF p_user_item_progress_history IS NULL
     OR p_user_item_progress_history = '[]'::JSONB THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();
  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_item_progress_history) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);
      v_item_id := (v_entry->>'item_id')::INTEGER;
      v_date := (v_entry->>'date')::DATE;
      v_direction := v_entry->>'direction';
      v_progress := (v_entry->>'progress')::INTEGER;
      v_max_progress := (v_entry->>'max_progress')::INTEGER;
      v_progress_change := (v_entry->>'progress_change')::INTEGER;
      v_updated_at := (v_entry->>'updated_at')::TIMESTAMPTZ;
      v_deleted_at := NULLIF(v_entry->>'deleted_at', 'null')::TIMESTAMPTZ;

      IF v_item_id < 0 OR v_progress < 0 OR v_max_progress < 0
         OR v_direction NOT IN ('czToEn', 'enToCz') THEN
        CONTINUE;
      END IF;

      INSERT INTO public.user_item_progress_history (
        user_id,
        date,
        item_id,
        direction,
        progress,
        max_progress,
        progress_change,
        updated_at,
        deleted_at
      )
      VALUES (
        v_user_id,
        v_date,
        v_item_id,
        v_direction,
        v_progress,
        v_max_progress,
        v_progress_change,
        v_updated_at,
        v_deleted_at
      )
      ON CONFLICT (user_id, date, item_id, direction)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        max_progress = EXCLUDED.max_progress,
        progress_change = EXCLUDED.progress_change,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at
      WHERE EXCLUDED.updated_at > public.user_item_progress_history.updated_at;
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        CONTINUE;
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
  user_id UUID,
  date DATE,
  item_id INTEGER,
  direction TEXT,
  progress INTEGER,
  max_progress INTEGER,
  progress_change INTEGER,
  updated_at TIMESTAMPTZ,
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
      SELECT 1
      FROM jsonb_array_elements(p_user_item_progress_history) AS entry
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
  ORDER BY h.date ASC, h.item_id ASC, h.direction ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_item_progress_history(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_item_progress_history(JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_item_progress_history(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_item_progress_history(
  UUID, TIMESTAMPTZ, JSONB, TIMESTAMPTZ
)
  TO authenticated;
