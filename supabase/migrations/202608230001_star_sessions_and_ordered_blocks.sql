BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.items WHERE block_id IS NULL) THEN
    RAISE EXCEPTION 'Every item must have block_id before applying star sessions migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.blocks
    WHERE is_removed_from_practice = FALSE
      AND sort_order IS NULL
  ) THEN
    RAISE EXCEPTION 'Every active practice block must have sort_order before applying star sessions migration';
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.upsert_fetch_user_scores(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);

ALTER TABLE public.user_scores RENAME COLUMN item_count TO star_count;

ALTER TABLE public.items ALTER COLUMN block_id SET NOT NULL;

ALTER TABLE public.blocks
  DROP CONSTRAINT IF EXISTS blocks_training_not_removed_from_practice_check,
  DROP COLUMN requires_initial_training,
  ADD CONSTRAINT blocks_active_practice_order_check
    CHECK (is_removed_from_practice = TRUE OR sort_order IS NOT NULL);

CREATE OR REPLACE FUNCTION public.upsert_user_scores(p_user_scores JSONB)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_date DATE;
  v_star_count INTEGER;
  v_updated_at TIMESTAMPTZ;
BEGIN
  IF p_user_scores IS NULL OR p_user_scores = '[]'::JSONB THEN RETURN; END IF;
  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_scores) LOOP
    BEGIN
      v_user_id := (v_entry->>private.json_key_user_id())::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);
      v_date := (v_entry->>'date')::DATE;
      v_star_count := GREATEST((v_entry->>'star_count')::INTEGER, 0);
      v_updated_at := (v_entry->>private.json_key_updated_at())::TIMESTAMPTZ;

      INSERT INTO public.user_scores (user_id, date, star_count, updated_at)
      VALUES (v_user_id, v_date, v_star_count, v_updated_at)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        star_count = GREATEST(public.user_scores.star_count, EXCLUDED.star_count),
        updated_at = GREATEST(public.user_scores.updated_at, EXCLUDED.updated_at);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE;
      WHEN others THEN CONTINUE;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_scores(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_scores JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  date DATE,
  star_count INTEGER,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_scores IS NOT NULL AND p_user_scores <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_scores) entry
      WHERE (entry->>private.json_key_user_id())::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_scores';
    END IF;
    PERFORM public.upsert_user_scores(p_user_scores);
  END IF;

  RETURN QUERY
  SELECT us.user_id, us.date, us.star_count, us.updated_at, us.deleted_at
  FROM public.user_scores us
  WHERE us.user_id = p_user_id
    AND us.updated_at >= COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY us.date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  show_in_topics BOOLEAN,
  is_removed_from_practice BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  RETURN QUERY
  SELECT
    p_user_id,
    b.id,
    b.name,
    b.note,
    b.grammar_chunk_id,
    b.sort_order,
    b.show_in_topics,
    b.is_removed_from_practice,
    ub.started_at,
    GREATEST(COALESCE(ub.updated_at, public.rpc_min_timestamptz()), b.updated_at),
    b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub ON ub.block_id = b.id AND ub.user_id = p_user_id
  WHERE GREATEST(COALESCE(ub.updated_at, public.rpc_min_timestamptz()), b.updated_at)
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC NULLS LAST, b.id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ,
  p_user_blocks JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  show_in_topics BOOLEAN,
  is_removed_from_practice BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);
  IF p_user_blocks IS NOT NULL AND p_user_blocks <> '[]'::JSONB THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_user_blocks) entry
      WHERE (entry->>private.json_key_user_id())::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_blocks';
    END IF;
    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;
  RETURN QUERY SELECT * FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_user_scores(JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_scores(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_scores(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;

COMMIT;

