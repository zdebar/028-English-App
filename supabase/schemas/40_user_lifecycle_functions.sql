CREATE OR REPLACE FUNCTION public.soft_delete_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.users
    SET deleted_at = NOW()
  WHERE id = auth.uid();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.restore_current_user_if_deleted()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.users
    SET deleted_at = NULL
  WHERE id = auth.uid()
    AND deleted_at IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_current_user_if_deleted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_current_user_if_deleted() TO authenticated;

CREATE OR REPLACE FUNCTION private.hard_delete_deleted_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_older_than INTERVAL;
  v_deleted INTEGER;
BEGIN
  SELECT (TRIM(BOTH '"' FROM s.value::TEXT))::INTERVAL
  INTO v_older_than
  FROM private.settings s
  WHERE s.key = 'soft_delete_retention';

  IF v_older_than IS NULL THEN
    v_older_than := INTERVAL '30 days';
  END IF;

  DELETE FROM public.users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - v_older_than;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.hard_delete_deleted_users() FROM anon, authenticated;
