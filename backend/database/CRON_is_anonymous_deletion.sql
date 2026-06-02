create or replace function public.delete_is_anonymous_users_older_than()
returns void
language plpgsql
security definer
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

select cron.unschedule('delete-anonymous-users-daily')
where exists (select 1 from cron.job where jobname = 'delete-anonymous-users-daily');

select cron.schedule(
  'delete-anonymous-users-daily',
  '0 3 * * *',
  $$select public.delete_is_anonymous_users_older_than();$$
);