CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Keep public.users in sync with auth.users (create a row containing only the id)
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."hard_delete_deleted_users"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

ALTER FUNCTION "private"."hard_delete_deleted_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_is_anonymous_users_older_than"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."delete_is_anonymous_users_older_than"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reactivate_user_if_deleted"() RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."reactivate_user_if_deleted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_user"() RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."soft_delete_user"() OWNER TO "postgres";