BEGIN;

-- Account deletion is permanent and immediate. The auth.users cascade removes
-- the public user row and all user-owned rows referencing it.
DROP FUNCTION IF EXISTS public.soft_delete_user();
DROP FUNCTION IF EXISTS public.restore_current_user_if_deleted();
DROP FUNCTION IF EXISTS private.hard_delete_deleted_users();

DO $do$
DECLARE
  v_job_name CONSTANT TEXT := 'hard_delete_deleted_users_daily';
BEGIN
  PERFORM cron.unschedule(v_job_name)
  WHERE EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = v_job_name
  );
END $do$;

ALTER TABLE public.users DROP COLUMN IF EXISTS deleted_at;

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

COMMIT;
