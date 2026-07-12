CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $do$
DECLARE
  v_job_name CONSTANT TEXT := 'hard_delete_deleted_users_daily';
BEGIN
  PERFORM cron.unschedule(v_job_name)
  WHERE EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = v_job_name
  );

  PERFORM cron.schedule(
    v_job_name,
    '0 3 * * *',
    $cron$SELECT private.hard_delete_deleted_users();$cron$
  );
END $do$;

DO $do$
DECLARE
  v_job_name CONSTANT TEXT := 'delete-anonymous-users-daily';
BEGIN
  PERFORM cron.unschedule(v_job_name)
  WHERE EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = v_job_name
  );

  PERFORM cron.schedule(
    v_job_name,
    '0 3 * * *',
    $cron$SELECT public.delete_is_anonymous_users_older_than();$cron$
  );
END $do$;
