create extension if not exists "pg_cron" with schema "pg_catalog";

create schema if not exists "private";

create sequence "private"."settings_id_seq";

drop policy "user_items_delete_own_non_demo" on "public"."user_items";

drop policy "user_items_insert_own_non_demo" on "public"."user_items";

drop policy "user_items_select_own" on "public"."user_items";

drop policy "user_items_update_own_non_demo" on "public"."user_items";

drop policy "user_scores_delete_own_non_demo" on "public"."user_scores";

drop policy "user_scores_insert_own_non_demo" on "public"."user_scores";

drop policy "user_scores_select_own" on "public"."user_scores";

drop policy "user_scores_update_own_non_demo" on "public"."user_scores";

drop policy "Enable users to view their own data only" on "public"."users";

drop policy "Enable read access for all users" on "public"."blocks";

drop policy "Enable read access for all users" on "public"."notes";

drop policy "Enable insert for users based on user_id" on "public"."user_items_history";

drop index if exists "public"."idx_blocks_updated_at";

drop index if exists "public"."idx_grammar_updated_at";

drop index if exists "public"."idx_lessons_updated_at";

drop index if exists "public"."idx_levels_updated_at";

drop index if exists "public"."idx_notes_updated_at";


  create table "private"."settings" (
    "id" integer not null default nextval('private.settings_id_seq'::regclass),
    "key" text not null,
    "value" jsonb not null,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "private"."settings" enable row level security;

alter sequence "private"."settings_id_seq" owned by "private"."settings"."id";

CREATE UNIQUE INDEX settings_key_key ON private.settings USING btree (key);

CREATE UNIQUE INDEX settings_pkey ON private.settings USING btree (id);

CREATE INDEX idx_items_block_id ON public.items USING btree (block_id);

CREATE INDEX idx_items_grammar_id ON public.items USING btree (grammar_id);

CREATE INDEX idx_items_lesson_id ON public.items USING btree (lesson_id);

CREATE INDEX idx_items_note_id ON public.items USING btree (note_id);

CREATE INDEX idx_lessons_level_id ON public.lessons USING btree (level_id);

CREATE INDEX idx_user_items_history_item_id ON public.user_items_history USING btree (item_id);

CREATE UNIQUE INDEX lessons_sort_order_key ON public.lessons USING btree (sort_order);

CREATE UNIQUE INDEX levels_sort_order_key ON public.levels USING btree (sort_order);

alter table "private"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "private"."settings" add constraint "settings_key_key" UNIQUE using index "settings_key_key";

alter table "public"."lessons" add constraint "lessons_sort_order_key" UNIQUE using index "lessons_sort_order_key";

alter table "public"."levels" add constraint "levels_sort_order_key" UNIQUE using index "levels_sort_order_key";

alter table "public"."users" add constraint "users_id_fk" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fk";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.hard_delete_deleted_users()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.assert_payload_user_id_matches_auth(p_payload_user_id uuid, p_auth_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_payload_user_id IS DISTINCT FROM p_auth_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Payload user_id must match auth.uid()';
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_is_anonymous_users_older_than()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reactivate_user_if_deleted()
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.require_auth_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN v_auth_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.require_auth_user_id_match(p_user_id uuid, p_param_name text DEFAULT 'p_user_id'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION '% is required', COALESCE(NULLIF(p_param_name, ''), 'p_user_id');
  END IF;

  v_auth_user_id := public.require_auth_user_id();
  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION '% must match auth.uid()', COALESCE(NULLIF(p_param_name, ''), 'p_user_id');
  END IF;

  RETURN v_auth_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rpc_min_timestamptz()
 RETURNS timestamp with time zone
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  SELECT '-infinity'::timestamptz;
$function$
;

CREATE OR REPLACE FUNCTION public.soft_delete_user()
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_count integer;
begin
  update public.users
    set deleted_at = now()
  where id = auth.uid();

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_user_items(p_user_id uuid, p_last_synced_at timestamp with time zone)
 RETURNS TABLE(item_id integer, user_id uuid, czech text, english text, note text, pronunciation text, audio text, is_study_item boolean, is_vocabulary boolean, sort_order integer, block_id integer, grammar_id integer, progress integer, progress_history jsonb, started_at timestamp with time zone, updated_at timestamp with time zone, deleted_at timestamp with time zone, next_at timestamp with time zone, mastered_at timestamp with time zone, lesson_id integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  RETURN QUERY
  SELECT
    i.id AS item_id,
    p_user_id AS user_id,
    i.czech,
    i.english,
    n.note,
    i.pronunciation,
    i.audio,
    i.is_study_item,
    i.is_vocabulary,
    i.sort_order,
    i.block_id,
    i.grammar_id,
    COALESCE(ui.progress, 0) AS progress,
    '[]'::jsonb AS progress_history,
    ui.started_at,
    COALESCE(ui.updated_at, i.updated_at) AS updated_at,
    i.deleted_at,
    ui.next_at,
    ui.mastered_at,
    i.lesson_id
  FROM public.items i
  LEFT JOIN public.user_items ui
    ON ui.item_id = i.id
    AND ui.user_id = p_user_id
  LEFT JOIN public.notes n
    ON n.id = i.note_id
  WHERE GREATEST(COALESCE(ui.updated_at, public.rpc_min_timestamptz()), i.updated_at)
    > COALESCE(p_last_synced_at, public.rpc_min_timestamptz());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Keep public.users in sync with auth.users (create a row containing only the id)
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_items(p_user_id uuid, p_last_synced_at timestamp with time zone, p_user_items jsonb DEFAULT '[]'::jsonb)
 RETURNS TABLE(item_id integer, user_id uuid, czech text, english text, note text, pronunciation text, audio text, is_study_item boolean, is_vocabulary boolean, sort_order integer, block_id integer, grammar_id integer, progress integer, progress_history jsonb, started_at timestamp with time zone, updated_at timestamp with time zone, deleted_at timestamp with time zone, next_at timestamp with time zone, mastered_at timestamp with time zone, lesson_id integer)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_history_enabled BOOLEAN := FALSE;
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  SELECT COALESCE(u.history_enabled, FALSE)
    INTO v_history_enabled
    FROM public.users u
   WHERE u.id = p_user_id;


  IF p_user_items IS NOT NULL AND p_user_items <> '[]'::JSONB THEN
    -- Validate every user_id in p_user_items matches p_user_id
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_items) AS entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_items';
    END IF;
    PERFORM public.upsert_user_items(p_user_items, v_history_enabled);
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.fetch_user_items(p_user_id, p_last_synced_at);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_fetch_user_scores(p_user_id uuid, p_last_synced_at timestamp with time zone, p_user_scores jsonb DEFAULT '[]'::jsonb)
 RETURNS TABLE(user_id uuid, date date, item_count integer, updated_at timestamp with time zone, deleted_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.require_auth_user_id_match(p_user_id);

  IF p_user_scores IS NOT NULL AND p_user_scores <> '[]'::JSONB THEN
    -- Validate every user_id in p_user_scores matches p_user_id
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_user_scores) AS entry
      WHERE (entry->>'user_id')::UUID IS DISTINCT FROM p_user_id
    ) THEN
      RAISE EXCEPTION 'p_user_id does not match at least one user_id in p_user_scores';
    END IF;
    PERFORM public.upsert_user_scores(p_user_scores);
  END IF;

  RETURN QUERY
  SELECT
    us.user_id,
    us.date,
    us.item_count,
    us.updated_at,
    us.deleted_at
  FROM public.user_scores us
  WHERE us.user_id = p_user_id
    AND us.updated_at >= COALESCE(p_last_synced_at, public.rpc_min_timestamptz())
  ORDER BY us.date ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_user_items(p_user_items jsonb, p_history_enabled boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_item_id INT;
  v_progress INT;
  v_started_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
  v_next_at TIMESTAMPTZ;
  v_mastered_at TIMESTAMPTZ;
  v_row_count INT := 0;
  v_main_error_count INT := 0;
  -- constants to avoid duplicated literals
  v_empty_json CONSTANT JSONB := '[]'::JSONB;
  v_item_id_re CONSTANT TEXT := '^[0-9]+$';
  v_null_text CONSTANT TEXT := 'null';
  v_key_user_id CONSTANT TEXT := 'user_id';
  v_key_item_id CONSTANT TEXT := 'item_id';
  v_total_count INT := 0;
  v_matched_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  IF p_user_items IS NULL OR p_user_items = v_empty_json THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    v_total_count := v_total_count + 1;
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_item_id := (v_entry->>v_key_item_id)::INT;

      -- skip entries for items that no longer exist (avoid FK errors)
      IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      v_progress := GREATEST((v_entry->>'progress')::INT, 0);
      v_started_at := NULLIF(v_entry->>'started_at', v_null_text)::TIMESTAMPTZ;
      v_updated_at := (v_entry->>'updated_at')::TIMESTAMPTZ;
      v_next_at := (v_entry->>'next_at')::TIMESTAMPTZ;
      v_mastered_at := (v_entry->>'mastered_at')::TIMESTAMPTZ;

      INSERT INTO public.user_items (
        user_id,
        item_id,
        progress,
        started_at,
        updated_at,
        next_at,
        mastered_at
      )
      VALUES (
        v_user_id,
        v_item_id,
        v_progress,
        v_started_at,
        v_updated_at,
        v_next_at,
        v_mastered_at
      )
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        started_at = EXCLUDED.started_at,
        updated_at = EXCLUDED.updated_at,
        next_at = EXCLUDED.next_at,
        mastered_at = EXCLUDED.mastered_at
      WHERE COALESCE(EXCLUDED.updated_at, '-infinity'::timestamptz)
        >= COALESCE(public.user_items.updated_at, '-infinity'::timestamptz);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_matched_count := v_matched_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_count := v_skipped_count + 1;
        v_main_error_count := v_main_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_items: incoming=% upserted=% skipped=% errors=%',
    v_total_count,
    v_matched_count,
    v_skipped_count,
    v_main_error_count;

  IF NOT COALESCE(p_history_enabled, FALSE) THEN
    RAISE LOG 'user_items_history: inserted=0, skipped_invalid=0, skipped_existing=0, skipped_disabled=1, errors=0';
    RETURN;
  END IF;

  -- Best-effort insert of progress history: validate created_at, skip invalid rows.
  -- Do not make history insertion fatal for the whole upsert operation.
  DECLARE
    v_entry jsonb;
    v_hist jsonb;
    v_item_id INT;
    v_hist_user_id UUID;
    v_progress INT;
    v_created_at timestamptz;
    v_inserted_count INT := 0;
    v_skipped_invalid INT := 0;
    v_error_count INT := 0;
    v_skipped_existing INT := 0;
  BEGIN
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
      BEGIN
        v_hist_user_id := (v_entry->>v_key_user_id)::UUID;
        PERFORM public.assert_payload_user_id_matches_auth(v_hist_user_id, v_auth_user_id);

        -- skip entries without numeric item_id
        IF NOT (v_entry->>v_key_item_id) ~ v_item_id_re THEN
          CONTINUE;
        END IF;
        v_item_id := (v_entry->>v_key_item_id)::INT;

        -- skip history for items that no longer exist (avoid FK errors)
        IF NOT EXISTS (SELECT 1 FROM public.items WHERE id = v_item_id) THEN
          CONTINUE;
        END IF;
        FOR v_hist IN SELECT * FROM jsonb_array_elements(COALESCE(v_entry->'progress_history', v_empty_json)) LOOP
          BEGIN
            -- validate and parse created_at; if invalid, skip this hist entry
            IF (v_hist->>'created_at') IS NULL THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END IF;
            BEGIN
              v_created_at := (v_hist->>'created_at')::timestamptz;
            EXCEPTION WHEN others THEN
              v_skipped_invalid := v_skipped_invalid + 1;
              CONTINUE;
            END;

            v_progress := (v_hist->>'progress')::INT;

            -- Insert if not exists (avoid duplicates). Use ON CONFLICT DO NOTHING if unique constraint added.
            BEGIN
              INSERT INTO public.user_items_history (item_id, user_id, progress, created_at)
              VALUES (v_item_id, v_hist_user_id, v_progress, v_created_at)
              ON CONFLICT DO NOTHING;
              IF FOUND THEN
                v_inserted_count := v_inserted_count + 1;
              ELSE
                v_skipped_existing := v_skipped_existing + 1;
              END IF;
            EXCEPTION WHEN others THEN
              v_error_count := v_error_count + 1;
              -- continue with next history item
            END;
          END;
        END LOOP;
      EXCEPTION
        WHEN insufficient_privilege THEN
          RAISE;
        WHEN others THEN
          v_skipped_invalid := v_skipped_invalid + 1;
          v_error_count := v_error_count + 1;
          CONTINUE;
      END;
    END LOOP;

    -- Log result so operator can be aware when items were skipped/failed.
    RAISE LOG 'user_items_history: inserted=%, skipped_invalid=%, skipped_existing=%, skipped_disabled=0, errors=%', v_inserted_count, v_skipped_invalid, v_skipped_existing, v_error_count;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_user_scores(p_user_scores jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_auth_user_id UUID;
  v_entry JSONB;
  v_user_id UUID;
  v_date DATE;
  v_item_count INTEGER;
  v_updated_at TIMESTAMPTZ;
  v_upserted_count INT := 0;
  v_skipped_invalid INT := 0;
  v_error_count INT := 0;
  v_row_count INT := 0;
BEGIN
  IF p_user_scores IS NULL OR p_user_scores = '[]'::JSONB THEN
    RETURN;
  END IF;

  v_auth_user_id := public.require_auth_user_id();

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_scores) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      PERFORM public.assert_payload_user_id_matches_auth(v_user_id, v_auth_user_id);

      v_date := (v_entry->>'date')::DATE;
      v_item_count := GREATEST((v_entry->>'item_count')::INTEGER, 0);
      v_updated_at := (v_entry->>'updated_at')::TIMESTAMPTZ;

      INSERT INTO public.user_scores (user_id, date, item_count, updated_at)
      VALUES (v_user_id, v_date, v_item_count, v_updated_at)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        item_count = GREATEST(public.user_scores.item_count, EXCLUDED.item_count),
        updated_at = GREATEST(public.user_scores.updated_at, EXCLUDED.updated_at);

      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      v_upserted_count := v_upserted_count + COALESCE(v_row_count, 0);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE;
      WHEN others THEN
        v_skipped_invalid := v_skipped_invalid + 1;
        v_error_count := v_error_count + 1;
        CONTINUE;
    END;
  END LOOP;

  RAISE LOG 'user_scores: upserted=%, skipped_invalid=%, errors=%',
    v_upserted_count,
    v_skipped_invalid,
    v_error_count;
END;
$function$
;


  create policy "Policy with security definer functions"
  on "public"."users"
  as permissive
  for all
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Enable read access for all users"
  on "public"."blocks"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable read access for all users"
  on "public"."notes"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable insert for users based on user_id"
  on "public"."user_items_history"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER trg_handle_new_auth_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


  create policy "Give users authenticated access to folder  1o4vxz4_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'audio-files'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));



