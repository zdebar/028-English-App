SET search_path TO public;

CREATE OR REPLACE FUNCTION public.is_non_demo_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path TO public
AS $$
  SELECT COALESCE(((auth.jwt() -> 'app_metadata'::TEXT) ->> 'is_demo'::TEXT)::BOOLEAN, FALSE) = FALSE;
$$;

REVOKE EXECUTE ON FUNCTION public.is_non_demo_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_non_demo_user() TO authenticated;

-- Catalog tables are shared content. Anonymous app users still read these
-- through Supabase Auth, so the direct table grants target authenticated only.
REVOKE ALL PRIVILEGES ON TABLE
  public.blocks,
  public.grammar,
  public.items,
  public.lessons,
  public.levels,
  public.notes
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.blocks,
  public.grammar,
  public.items,
  public.lessons,
  public.levels,
  public.notes
TO authenticated;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.blocks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grammar;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lessons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.levels;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notes;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.blocks;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.grammar;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.items;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.lessons;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.levels;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.notes;

CREATE POLICY catalog_select_authenticated ON public.blocks
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.grammar
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.items
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.lessons
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.levels
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.notes
  FOR SELECT TO authenticated
  USING (TRUE);

REVOKE ALL PRIVILEGES ON TABLE public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

REVOKE ALL PRIVILEGES ON TABLE
  public.user_items,
  public.user_scores,
  public.user_blocks
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_items,
  public.user_scores,
  public.user_blocks
TO authenticated;

ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow regular users to modify their own data" ON public.user_items;
DROP POLICY IF EXISTS user_items_delete_own_non_demo ON public.user_items;
DROP POLICY IF EXISTS user_items_insert_own_non_demo ON public.user_items;
DROP POLICY IF EXISTS user_items_select_own ON public.user_items;
DROP POLICY IF EXISTS user_items_update_own_non_demo ON public.user_items;

CREATE POLICY user_items_select_own ON public.user_items
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_items_insert_own_non_demo ON public.user_items
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_items_update_own_non_demo ON public.user_items
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_items_delete_own_non_demo ON public.user_items
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

DROP POLICY IF EXISTS "Allow regular users to modify their own data" ON public.user_scores;
DROP POLICY IF EXISTS user_scores_delete_own_non_demo ON public.user_scores;
DROP POLICY IF EXISTS user_scores_insert_own_non_demo ON public.user_scores;
DROP POLICY IF EXISTS user_scores_select_own ON public.user_scores;
DROP POLICY IF EXISTS user_scores_update_own_non_demo ON public.user_scores;

CREATE POLICY user_scores_select_own ON public.user_scores
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_scores_insert_own_non_demo ON public.user_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_scores_update_own_non_demo ON public.user_scores
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_scores_delete_own_non_demo ON public.user_scores
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

DROP POLICY IF EXISTS user_blocks_delete_own_non_demo ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_insert_own_non_demo ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_select_own ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_update_own_non_demo ON public.user_blocks;

CREATE POLICY user_blocks_select_own ON public.user_blocks
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_blocks_insert_own_non_demo ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_blocks_update_own_non_demo ON public.user_blocks
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_blocks_delete_own_non_demo ON public.user_blocks
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

REVOKE ALL PRIVILEGES ON TABLE public.user_items_history FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.user_items_history TO authenticated;

ALTER TABLE public.user_items_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.user_items_history;
DROP POLICY IF EXISTS user_items_history_insert_own ON public.user_items_history;

CREATE POLICY user_items_history_insert_own ON public.user_items_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
