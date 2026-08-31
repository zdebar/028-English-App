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
  public.grammar_groups,
  public.grammar_chunks,
  public.grammar_chunk_examples,
  public.items,
  public.lessons,
  public.levels,
  public.notes,
  public.pronunciation_groups,
  public.pronunciation_group_items,
  public.topics
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.blocks,
  public.grammar_groups,
  public.grammar_chunks,
  public.grammar_chunk_examples,
  public.items,
  public.lessons,
  public.levels,
  public.notes,
  public.pronunciation_groups,
  public.pronunciation_group_items,
  public.topics
TO authenticated;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_chunk_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronunciation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronunciation_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.blocks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grammar_groups;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.grammar_chunks;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lessons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.levels;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.notes;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.blocks;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.grammar_groups;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.grammar_chunks;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.grammar_chunk_examples;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.items;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.lessons;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.levels;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.notes;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.pronunciation_groups;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.pronunciation_group_items;
DROP POLICY IF EXISTS catalog_select_authenticated ON public.topics;

CREATE POLICY catalog_select_authenticated ON public.blocks
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.grammar_groups
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.grammar_chunks
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.grammar_chunk_examples
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

CREATE POLICY catalog_select_authenticated ON public.pronunciation_groups
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.pronunciation_group_items
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY catalog_select_authenticated ON public.topics
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
  public.user_item_progress_history
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.user_items,
  public.user_item_progress_history
TO authenticated;

ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_item_progress_history ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Allow regular users to modify their own data" ON public.user_item_progress_history;
DROP POLICY IF EXISTS user_item_progress_history_delete_own_non_demo ON public.user_item_progress_history;
DROP POLICY IF EXISTS user_item_progress_history_insert_own_non_demo ON public.user_item_progress_history;
DROP POLICY IF EXISTS user_item_progress_history_select_own ON public.user_item_progress_history;
DROP POLICY IF EXISTS user_item_progress_history_update_own_non_demo ON public.user_item_progress_history;

CREATE POLICY user_item_progress_history_select_own ON public.user_item_progress_history
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY user_item_progress_history_insert_own_non_demo ON public.user_item_progress_history
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_item_progress_history_update_own_non_demo ON public.user_item_progress_history
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );

CREATE POLICY user_item_progress_history_delete_own_non_demo ON public.user_item_progress_history
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND public.is_non_demo_user()
  );
