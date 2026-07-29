ALTER TABLE public.user_items_history
  ADD COLUMN outcome TEXT NOT NULL DEFAULT 'legacy'
  CHECK (outcome IN ('correct', 'incorrect', 'skip', 'legacy'));

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
  v_legacy_direction CONSTANT TEXT := 'legacy';
  v_legacy_outcome CONSTANT TEXT := 'legacy';
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
      IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.user_items (
        user_id,
        item_id,
        progress_cz_to_en,
        progress_en_to_cz,
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
              v_legacy_direction
            );
            IF v_direction NOT IN ('czToEn', 'enToCz', v_legacy_direction) THEN
              CONTINUE;
            END IF;
            v_outcome := COALESCE(
              NULLIF(v_history->>'outcome', 'null'),
              v_legacy_outcome
            );
            IF v_outcome NOT IN ('correct', 'incorrect', 'skip', v_legacy_outcome) THEN
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

REVOKE EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_items(JSONB, BOOLEAN) TO authenticated;

