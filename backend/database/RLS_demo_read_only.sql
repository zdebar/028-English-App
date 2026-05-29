-- Read-only mode for demo users on user progress tables.
--
-- Requirement: demo user should have `app_metadata.is_demo = true` in Supabase Auth.
--
-- This script enables RLS and allows each user to read only their own rows,
-- while write operations are blocked for demo users.

-- Small helpers to avoid repeating the JSON path literals.
CREATE OR REPLACE FUNCTION jwt_app_metadata_key()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 'app_metadata';
$$;

CREATE OR REPLACE FUNCTION jwt_is_demo_key()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 'is_demo';
$$;

ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_items_select_own ON public.user_items;
DROP POLICY IF EXISTS user_items_insert_own_non_demo ON public.user_items;
DROP POLICY IF EXISTS user_items_update_own_non_demo ON public.user_items;
DROP POLICY IF EXISTS user_items_delete_own_non_demo ON public.user_items;

CREATE POLICY user_items_select_own
ON public.user_items
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY user_items_insert_own_non_demo
ON public.user_items
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
);

CREATE POLICY user_items_update_own_non_demo
ON public.user_items
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
);

CREATE POLICY user_items_delete_own_non_demo
ON public.user_items
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
);

DROP POLICY IF EXISTS user_scores_select_own ON public.user_scores;
DROP POLICY IF EXISTS user_scores_insert_own_non_demo ON public.user_scores;
DROP POLICY IF EXISTS user_scores_update_own_non_demo ON public.user_scores;
DROP POLICY IF EXISTS user_scores_delete_own_non_demo ON public.user_scores;

CREATE POLICY user_scores_select_own
ON public.user_scores
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY user_scores_insert_own_non_demo
ON public.user_scores
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
);

CREATE POLICY user_scores_update_own_non_demo
ON public.user_scores
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
)
WITH CHECK (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
);

CREATE POLICY user_scores_delete_own_non_demo
ON public.user_scores
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND COALESCE((auth.jwt() -> jwt_app_metadata_key() ->> jwt_is_demo_key())::BOOLEAN, FALSE) = FALSE
);
