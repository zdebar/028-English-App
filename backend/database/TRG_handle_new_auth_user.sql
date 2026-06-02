create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  -- Keep public.users in sync with auth.users (create a row containing only the id)
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'trg_handle_new_auth_user'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) then
    create trigger trg_handle_new_auth_user
      after insert on auth.users
      for each row
      execute procedure public.handle_new_auth_user();
  end if;
end $$;