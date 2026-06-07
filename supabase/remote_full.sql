


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) RETURNS TABLE("item_id" integer, "user_id" "uuid", "czech" "text", "english" "text", "note" "text", "pronunciation" "text", "audio" "text", "is_study_item" boolean, "is_vocabulary" boolean, "sort_order" integer, "block_id" integer, "grammar_id" integer, "progress" integer, "progress_history" "jsonb", "started_at" timestamp with time zone, "updated_at" timestamp with time zone, "deleted_at" timestamp with time zone, "next_at" timestamp with time zone, "mastered_at" timestamp with time zone, "lesson_id" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()';
  END IF;

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
  WHERE GREATEST(COALESCE(ui.updated_at, '-infinity'::timestamptz), i.updated_at)
    > COALESCE(p_last_synced_at, '1970-01-01'::timestamptz);
END;
$$;


ALTER FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb" DEFAULT '[]'::"jsonb") RETURNS TABLE("item_id" integer, "user_id" "uuid", "czech" "text", "english" "text", "note" "text", "pronunciation" "text", "audio" "text", "is_study_item" boolean, "is_vocabulary" boolean, "sort_order" integer, "block_id" integer, "grammar_id" integer, "progress" integer, "progress_history" "jsonb", "started_at" timestamp with time zone, "updated_at" timestamp with time zone, "deleted_at" timestamp with time zone, "next_at" timestamp with time zone, "mastered_at" timestamp with time zone, "lesson_id" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_auth_user_id UUID;
  v_history_enabled BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()';
  END IF;

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
$$;


ALTER FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb" DEFAULT '[]'::"jsonb") RETURNS TABLE("user_id" "uuid", "date" "date", "item_count" integer, "updated_at" timestamp with time zone, "deleted_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_auth_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'p_user_id must match auth.uid()';
  END IF;

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
    AND us.updated_at >= p_last_synced_at
  ORDER BY us.date ASC;
END;
$$;


ALTER FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $_$
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

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_items) LOOP
    v_total_count := v_total_count + 1;
    BEGIN
      v_user_id := (v_entry->>v_key_user_id)::UUID;
      IF v_user_id IS DISTINCT FROM v_auth_user_id THEN
        RAISE EXCEPTION USING
          ERRCODE = '42501',
          MESSAGE = 'Payload user_id must match auth.uid()';
      END IF;

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
      WHEN SQLSTATE '42501' THEN
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
        IF v_hist_user_id IS DISTINCT FROM v_auth_user_id THEN
          RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'Payload user_id must match auth.uid()';
        END IF;

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
        WHEN SQLSTATE '42501' THEN
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
$_$;


ALTER FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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

  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_user_scores) LOOP
    BEGIN
      v_user_id := (v_entry->>'user_id')::UUID;
      IF v_user_id IS DISTINCT FROM v_auth_user_id THEN
        RAISE EXCEPTION USING
          ERRCODE = '42501',
          MESSAGE = 'Payload user_id must match auth.uid()';
      END IF;

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
      WHEN SQLSTATE '42501' THEN
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
$$;


ALTER FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "note" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "blocks_sort_order_check" CHECK (("sort_order" >= 1))
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."blocks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."blocks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."blocks_id_seq" OWNED BY "public"."blocks"."id";



CREATE TABLE IF NOT EXISTS "public"."grammar" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "note" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sort_order" integer NOT NULL,
    CONSTRAINT "grammar_sort_order_check" CHECK (("sort_order" >= 1))
);


ALTER TABLE "public"."grammar" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."grammar_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."grammar_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."grammar_id_seq" OWNED BY "public"."grammar"."id";



CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" integer NOT NULL,
    "czech" "text" NOT NULL,
    "english" "text" NOT NULL,
    "pronunciation" "text",
    "audio" "text",
    "sort_order" integer NOT NULL,
    "grammar_id" integer,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lesson_id" integer NOT NULL,
    "is_study_item" boolean DEFAULT true NOT NULL,
    "block_id" integer,
    "note_id" integer,
    "is_vocabulary" boolean DEFAULT true NOT NULL,
    CONSTRAINT "items_sequence_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."items_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."items_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."items_id_seq" OWNED BY "public"."items"."id";



CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "level_id" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sort_order" integer NOT NULL,
    "note" "text" NOT NULL
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lessons_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lessons_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lessons_id_seq" OWNED BY "public"."lessons"."id";



CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "sort_order" integer NOT NULL,
    "note" "text" NOT NULL
);


ALTER TABLE "public"."levels" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."levels_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."levels_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."levels_id_seq" OWNED BY "public"."levels"."id";



CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" integer NOT NULL,
    "note" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notes_id_seq" OWNED BY "public"."notes"."id";



CREATE TABLE IF NOT EXISTS "public"."user_items" (
    "user_id" "uuid" NOT NULL,
    "item_id" integer NOT NULL,
    "progress" integer DEFAULT 0 NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "next_at" timestamp with time zone,
    "mastered_at" timestamp with time zone,
    CONSTRAINT "user_items_progress_check" CHECK (("progress" >= 0))
);


ALTER TABLE "public"."user_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_items_history" (
    "item_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "progress" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_items_history_progress_check" CHECK (("progress" >= 0))
);


ALTER TABLE "public"."user_items_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_scores" (
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "item_count" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "user_scores_item_count_check" CHECK (("item_count" >= 0))
);


ALTER TABLE "public"."user_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "history_enabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."blocks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."blocks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."grammar" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."grammar_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."items" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."items_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lessons" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lessons_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."levels" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."levels_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."notes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_sort_order_key" UNIQUE ("sort_order");



ALTER TABLE ONLY "public"."grammar"
    ADD CONSTRAINT "grammar_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."grammar"
    ADD CONSTRAINT "grammar_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_note_key" UNIQUE ("note");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_items_history"
    ADD CONSTRAINT "user_items_history_pkey" PRIMARY KEY ("user_id", "item_id", "created_at");



ALTER TABLE ONLY "public"."user_items"
    ADD CONSTRAINT "user_items_pkey" PRIMARY KEY ("user_id", "item_id");



ALTER TABLE ONLY "public"."user_scores"
    ADD CONSTRAINT "user_score_pkey" PRIMARY KEY ("user_id", "date");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_blocks_updated_at" ON "public"."blocks" USING "btree" ("updated_at");



CREATE INDEX "idx_grammar_updated_at" ON "public"."grammar" USING "btree" ("updated_at");



CREATE INDEX "idx_items_updated_at" ON "public"."items" USING "btree" ("updated_at");



CREATE INDEX "idx_lessons_level_sort_order" ON "public"."lessons" USING "btree" ("level_id", "sort_order");



CREATE INDEX "idx_lessons_updated_at" ON "public"."lessons" USING "btree" ("updated_at");



CREATE INDEX "idx_levels_sort_order" ON "public"."levels" USING "btree" ("sort_order");



CREATE INDEX "idx_levels_updated_at" ON "public"."levels" USING "btree" ("updated_at");



CREATE INDEX "idx_notes_updated_at" ON "public"."notes" USING "btree" ("updated_at");



CREATE INDEX "idx_user_items_item_user" ON "public"."user_items" USING "btree" ("item_id", "user_id") INCLUDE ("progress", "started_at", "updated_at", "next_at", "mastered_at");



CREATE INDEX "idx_user_items_updated_at" ON "public"."user_items" USING "btree" ("updated_at");



CREATE INDEX "idx_user_items_user_updated_item" ON "public"."user_items" USING "btree" ("user_id", "updated_at", "item_id") INCLUDE ("progress", "started_at", "next_at", "mastered_at");



CREATE INDEX "idx_user_scores_updated_at" ON "public"."user_scores" USING "btree" ("updated_at");



CREATE INDEX "idx_user_scores_user_id_updated_at" ON "public"."user_scores" USING "btree" ("user_id", "updated_at");



CREATE OR REPLACE TRIGGER "trg_set_updated_at__blocks" BEFORE UPDATE ON "public"."blocks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__grammar" BEFORE UPDATE ON "public"."grammar" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__items" BEFORE UPDATE ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__lessons" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__levels" BEFORE UPDATE ON "public"."levels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__user_items" BEFORE UPDATE ON "public"."user_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_updated_at__user_scores" BEFORE UPDATE ON "public"."user_scores" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."user_items"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_scores"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_items_history"
    ADD CONSTRAINT "user_items_history_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_items_history"
    ADD CONSTRAINT "user_items_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_items"
    ADD CONSTRAINT "user_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE CASCADE;



CREATE POLICY "Allow regular users to modify their own data" ON "public"."user_items" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow regular users to modify their own data" ON "public"."user_scores" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."user_items_history" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."blocks" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."grammar" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."lessons" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."levels" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."notes" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."users" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grammar" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_items_delete_own_non_demo" ON "public"."user_items" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false)));



ALTER TABLE "public"."user_items_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_items_insert_own_non_demo" ON "public"."user_items" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false)));



CREATE POLICY "user_items_select_own" ON "public"."user_items" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_items_update_own_non_demo" ON "public"."user_items" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false)));



ALTER TABLE "public"."user_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_scores_delete_own_non_demo" ON "public"."user_scores" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false)));



CREATE POLICY "user_scores_insert_own_non_demo" ON "public"."user_scores" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false)));



CREATE POLICY "user_scores_select_own" ON "public"."user_scores" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_scores_update_own_non_demo" ON "public"."user_scores" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (COALESCE(((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_demo'::"text"))::boolean, false) = false)));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_auth_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_items"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_items" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_fetch_user_scores"("p_user_id" "uuid", "p_last_synced_at" timestamp with time zone, "p_user_scores" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_items"("p_user_items" "jsonb", "p_history_enabled" boolean) TO "service_role";



REVOKE ALL ON FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_user_scores"("p_user_scores" "jsonb") TO "service_role";


















GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."blocks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."blocks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."blocks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."grammar" TO "anon";
GRANT ALL ON TABLE "public"."grammar" TO "authenticated";
GRANT ALL ON TABLE "public"."grammar" TO "service_role";



GRANT ALL ON SEQUENCE "public"."grammar_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."grammar_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."grammar_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lessons_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";



GRANT ALL ON SEQUENCE "public"."levels_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."levels_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."levels_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_items" TO "anon";
GRANT ALL ON TABLE "public"."user_items" TO "authenticated";
GRANT ALL ON TABLE "public"."user_items" TO "service_role";



GRANT ALL ON TABLE "public"."user_items_history" TO "anon";
GRANT ALL ON TABLE "public"."user_items_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_items_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_scores" TO "anon";
GRANT ALL ON TABLE "public"."user_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_scores" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































