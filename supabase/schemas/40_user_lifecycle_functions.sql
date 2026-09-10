CREATE OR REPLACE FUNCTION public.hard_delete_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  DELETE FROM auth.users
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.hard_delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hard_delete_user() TO authenticated;
