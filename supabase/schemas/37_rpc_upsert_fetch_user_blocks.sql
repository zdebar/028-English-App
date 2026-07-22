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
  lesson_id INTEGER,
  grammar_chunk_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  show_in_topics BOOLEAN,
  is_practice_block BOOLEAN,
  requires_initial_training BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_key_user_id CONSTANT TEXT := private.json_key_user_id();
  v_user_id_mismatch_message CONSTANT TEXT := 'p_user_id does not match at least one user_id in p_user_blocks';
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

REVOKE EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_fetch_user_blocks(UUID, TIMESTAMPTZ, JSONB) TO authenticated;
