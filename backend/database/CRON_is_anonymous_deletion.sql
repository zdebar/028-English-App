create or replace function public.delete_is_anonymous_users_older_than()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_older_than interval;
begin
  select (trim(both '"' from s.value::text))::interval
    into v_older_than
  from private.settings s
  where s.key = 'is_anonymous_deletion';

  if v_older_than is null then
    raise notice 'private.settings.is_anonymous_deletion is not set; skipping anonymous deletion.';
    return;
  end if;

  delete from auth.users
  where is_anonymous is true
    and created_at < (now() - v_older_than);

  return;
end;
$$;

create extension if not exists pg_cron;

do $do$
declare
  v_job_name constant text := 'delete-anonymous-users-daily';
begin
  perform cron.unschedule(v_job_name)
  where exists (select 1 from cron.job where jobname = v_job_name);

  perform cron.schedule(
    v_job_name,
    '0 3 * * *',
    $cron$select public.delete_is_anonymous_users_older_than();$cron$
  );
end $do$;

revoke execute on function public.delete_is_anonymous_users_older_than()
from anon, public;
