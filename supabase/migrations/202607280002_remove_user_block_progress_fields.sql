DROP FUNCTION IF EXISTS public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.fetch_user_blocks(UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.upsert_user_blocks(JSONB);

UPDATE public.user_blocks
SET started_at = COALESCE(
  started_at,
  mastered_at,
  CASE WHEN progress > 0 THEN updated_at END
)
WHERE started_at IS NULL
  AND (mastered_at IS NOT NULL OR progress > 0);

DROP INDEX IF EXISTS public.idx_user_blocks_user_updated_block;

ALTER TABLE public.user_blocks
  ALTER COLUMN started_at DROP DEFAULT,
  DROP COLUMN progress,
  DROP COLUMN next_at,
  DROP COLUMN mastered_at;

CREATE INDEX idx_user_blocks_user_updated_block
  ON public.user_blocks (user_id, updated_at, block_id)
  INCLUDE (started_at);

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
  requires_initial_training BOOLEAN,
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
    p_user_id AS user_id,
    b.id AS block_id,
    b.name,
    b.note,
    b.grammar_chunk_id,
    b.sort_order,
    b.show_in_topics,
    b.is_removed_from_practice,
    b.requires_initial_training,
    ub.started_at,
    GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) AS updated_at,
    b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub
    ON ub.block_id = b.id
    AND ub.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC NULLS LAST, b.id ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;

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
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_key_block_id CONSTANT TEXT := 'block_id';
  v_key_started_at CONSTANT TEXT := 'started_at';
  v_key_updated_at CONSTANT TEXT := private.json_key_updated_at();
  v_row_count INT := 0;
  v_upserted_count INT := 0;
  v_skipped_count INT := 0;
  v_error_count INT := 0;
BEGIN
  IF p_user_blocks IS NULL OR p_user_blocks = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_blocks) LOOP
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      v_block_id := (v_entry->>v_key_block_id)::INT;
      IF NOT EXISTS (SELECT 1 FROM public.blocks WHERE id = v_block_id) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_started_at := NULLIF(v_entry->>v_key_started_at, v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>v_key_updated_at)::TIMESTAMPTZ;

      INSERT INTO public.user_blocks (
        user_id,
        block_id,
        started_at,
        updated_at
      )
      VALUES (
        v_user_id,
        v_block_id,
        v_started_at,
        v_updated_at
      )
      ON CONFLICT (block_id, user_id)
      DO UPDATE SET
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at
      WHERE COALESCE(EXCLUDED.updated_at, public.rpc_min_timestamptz())
        >= COALESCE(public.user_blocks.updated_at, public.rpc_min_timestamptz());

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_upserted_count := v_upserted_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE;
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
  requires_initial_training BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_user_id_mismatch_message CONSTANT TEXT :=
    'p_user_id does not match at least one user_id in p_user_blocks';
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_blocks IS NOT NULL AND p_user_blocks <> v_empty_json THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_blocks) AS entry
      WHERE (entry->>v_key_user_id)::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION '%', v_user_id_mismatch_message;
    END IF;
    PERFORM public.upsert_user_blocks(p_user_blocks);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_blocks(p_user_id, p_last_synced_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB)
  TO authenticated;
