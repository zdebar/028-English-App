begin;

-- 0) Soft-delete
create or replace function public.soft_delete_user()
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.users
    set deleted_at = now()
  where id = auth.uid();

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

-- 1) Soft-delete reactivation RPC (single request; conditional update)
create or replace function public.reactivate_user_if_deleted()
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Reactivate only if deleted_at is set
  update public.users
    set deleted_at = null
  where id = auth.uid()
    and deleted_at is not null;

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

-- 2) Hard-delete function for retention (default: delete after 30 days)
create schema if not exists private;

create or replace function private.hard_delete_deleted_users()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_older_than interval;
  v_deleted integer;
begin
  select (trim(both '"' from s.value::text))::interval
  into v_older_than
  from private.settings s
  where s.key = 'soft_delete_retention';

  -- fallback if setting missing/null
  if v_older_than is null then
    v_older_than := interval '30 days';
  end if;

  delete from public.users
  where deleted_at is not null
    and deleted_at < now() - v_older_than;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function private.hard_delete_deleted_users() from anon, authenticated;

-- 3) pg_cron setup + daily schedule
create extension if not exists pg_cron;

-- Ensure the job is unique by name; remove/recreate to keep it idempotent
select cron.unschedule('hard_delete_deleted_users_daily')
where exists (
  select 1 from cron.job
  where jobname = 'hard_delete_deleted_users_daily'
);

-- pg_cron stores schedules in cron.job; jobname must be unique
select cron.schedule(
  'hard_delete_deleted_users_daily',
  '0 3 * * *', -- daily at 03:00
  $$select private.hard_delete_deleted_users();$$
);

commit;