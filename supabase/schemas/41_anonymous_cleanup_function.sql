CREATE OR REPLACE FUNCTION public.delete_is_anonymous_users_older_than()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_older_than INTERVAL;
BEGIN
  SELECT (TRIM(BOTH '"' FROM s.value::TEXT))::INTERVAL
    INTO v_older_than
  FROM private.settings s
  WHERE s.key = 'is_anonymous_deletion';

  IF v_older_than IS NULL THEN
    RAISE NOTICE 'private.settings.is_anonymous_deletion is not set; skipping anonymous deletion.';
    RETURN;
  END IF;

  DELETE FROM auth.users
  WHERE is_anonymous IS TRUE
    AND created_at < (NOW() - v_older_than);

  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_is_anonymous_users_older_than() FROM anon, PUBLIC;
