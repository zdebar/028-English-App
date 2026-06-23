CREATE OR REPLACE FUNCTION private.json_key_user_id()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO pg_catalog
AS $$
  SELECT 'user_id'::TEXT;
$$;

CREATE OR REPLACE FUNCTION private.json_key_updated_at()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path TO pg_catalog
AS $$
  SELECT 'updated_at'::TEXT;
$$;

GRANT USAGE ON SCHEMA private TO authenticated;

REVOKE EXECUTE ON FUNCTION private.json_key_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.json_key_user_id() TO authenticated;

REVOKE EXECUTE ON FUNCTION private.json_key_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.json_key_updated_at() TO authenticated;
