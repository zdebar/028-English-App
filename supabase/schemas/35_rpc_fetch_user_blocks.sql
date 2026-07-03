CREATE OR REPLACE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  lesson_id INTEGER,
  grammar_id INTEGER,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
  show_in_topics BOOLEAN,
  is_practice_block BOOLEAN,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  next_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
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
    b.lesson_id,
    b.grammar_id,
    b.sort_order,
    COALESCE(ub.progress, 0) AS progress,
    b.is_vocabulary,
    b.show_in_topics,
    b.is_practice_block,
    ub.started_at,
    GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) AS updated_at,
    ub.next_at,
    ub.mastered_at,
    b.deleted_at
  FROM public.blocks b
  LEFT JOIN public.user_blocks ub
    ON ub.block_id = b.id
    AND ub.user_id = p_user_id
  WHERE GREATEST(
      COALESCE(ub.updated_at, public.rpc_min_timestamptz()),
      b.updated_at
    ) > COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY b.sort_order ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_user_blocks(UUID, TIMESTAMPTZ) TO authenticated;
