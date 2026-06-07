CREATE OR REPLACE FUNCTION public.require_auth_user_id()
RETURNS UUID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN v_auth_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.require_auth_user_id_match(
  p_user_id UUID,
  p_param_name TEXT DEFAULT 'p_user_id'
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION '% is required', COALESCE(NULLIF(p_param_name, ''), 'p_user_id');
  END IF;

  v_auth_user_id := public.require_auth_user_id();
  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION '% must match auth.uid()', COALESCE(NULLIF(p_param_name, ''), 'p_user_id');
  END IF;

  RETURN v_auth_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_payload_user_id_matches_auth(
  p_payload_user_id UUID,
  p_auth_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF p_payload_user_id IS DISTINCT FROM p_auth_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Payload user_id must match auth.uid()';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.require_auth_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_auth_user_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.require_auth_user_id_match(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_auth_user_id_match(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.assert_payload_user_id_matches_auth(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_payload_user_id_matches_auth(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_min_timestamptz()
RETURNS TIMESTAMPTZ
LANGUAGE sql
SET search_path TO public
AS $$
  SELECT '-infinity'::timestamptz;
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_min_timestamptz() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_min_timestamptz() TO authenticated;