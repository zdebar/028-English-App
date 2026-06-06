CREATE OR REPLACE FUNCTION "public"."assert_payload_user_id_matches_auth"("p_payload_user_id" "uuid", "p_auth_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_payload_user_id IS DISTINCT FROM p_auth_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'Payload user_id must match auth.uid()';
  END IF;
END;
$$;

ALTER FUNCTION "public"."assert_payload_user_id_matches_auth"("p_payload_user_id" "uuid", "p_auth_user_id" "uuid") OWNER TO "postgres";



CREATE OR REPLACE FUNCTION "public"."require_auth_user_id"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN v_auth_user_id;
END;
$$;

ALTER FUNCTION "public"."require_auth_user_id"() OWNER TO "postgres";



CREATE OR REPLACE FUNCTION "public"."require_auth_user_id_match"("p_user_id" "uuid", "p_param_name" "text" DEFAULT 'p_user_id'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;

ALTER FUNCTION "public"."require_auth_user_id_match"("p_user_id" "uuid", "p_param_name" "text") OWNER TO "postgres";



CREATE OR REPLACE FUNCTION "public"."rpc_min_timestamptz"() RETURNS timestamp with time zone
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  SELECT '-infinity'::timestamptz;
$$;

ALTER FUNCTION "public"."rpc_min_timestamptz"() OWNER TO "postgres";



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