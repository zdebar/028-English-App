CREATE OR REPLACE FUNCTION public.fetch_user_blocks(
  p_user_id UUID,
  p_last_synced_at TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  block_id INTEGER,
  name TEXT,
  note TEXT,
  sort_order INTEGER,
  progress INTEGER,
  is_vocabulary BOOLEAN,
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
    b.sort_order,
    COALESCE(ub.progress, 0) AS progress,
    COALESCE(ub.is_vocabulary, FALSE) AS is_vocabulary,
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
