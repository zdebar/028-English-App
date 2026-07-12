-- ============================================================
-- Advisor security hardening
-- ============================================================

-- 1. Revoke API execution access from the legacy function.
--
-- The function exists in the deployed database but is not present
-- in the repository and is not referenced by the application.
-- The conditional check prevents fresh databases from failing if
-- the function does not exist there.
DO $$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END
$$;


-- 2. Restrict audio downloads to authenticated sessions.
--
-- Supabase Anonymous Auth users use the authenticated role, so
-- anonymous-auth users can still access audio after signing in
-- anonymously. Completely unauthenticated visitors cannot.
DROP POLICY IF EXISTS audio_files_read_authenticated_anon
ON storage.objects;

CREATE POLICY audio_files_read_authenticated
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('audio-files', 'audio-archive')
);