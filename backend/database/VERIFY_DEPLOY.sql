-- Post-deploy verification script (read-only)
-- Run after applying SQL and before/after frontend release.

SET search_path TO public, pg_catalog;

-- 1) Verify RPC function signatures
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS args,
  pg_get_function_result(p.oid) AS returns,
  l.lanname AS language
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.proname IN (
    'fetch_user_items',
    'upsert_user_items',
    'fetch_user_scores',
    'upsert_user_scores',
    'set_updated_at',
    'handle_new_auth_user',
    'restore_user_on_signin'
  )
ORDER BY p.proname;

-- 2) Verify required columns exist with expected names
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'items' AND column_name IN ('sort_order', 'updated_at', 'deleted_at'))
    OR (table_name = 'levels' AND column_name IN ('sort_order', 'updated_at', 'deleted_at'))
    OR (table_name = 'lessons' AND column_name IN ('sort_order', 'level_id', 'updated_at', 'deleted_at'))
    OR (table_name = 'user_items' AND column_name IN ('progress', 'started_at', 'updated_at', 'next_at', 'mastered_at'))
    OR (table_name = 'user_scores' AND column_name IN ('item_count', 'updated_at'))
  )
ORDER BY table_name, column_name;

-- 3) Verify triggers are present and enabled
SELECT
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND t.tgisinternal = false
  AND t.tgname IN (
    'trg_set_updated_at__grammar',
    'trg_set_updated_at__levels',
    'trg_set_updated_at__lessons',
    'trg_set_updated_at__items',
    'trg_set_updated_at__user_items',
    'trg_set_updated_at__user_scores'
  )
ORDER BY t.tgname;

-- 4) Verify auth triggers exist
SELECT
  t.tgname AS trigger_name,
  nc.nspname || '.' || c.relname AS table_name,
  p.proname AS function_name,
  t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace nc ON nc.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace np ON np.oid = p.pronamespace
WHERE nc.nspname = 'auth'
  AND c.relname = 'users'
  AND np.nspname = 'public'
  AND t.tgname IN ('on_auth_user_created', 'on_auth_user_signin')
ORDER BY t.tgname;

-- 5) Verify key indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_items_updated_at',
    'idx_user_items_updated_at',
    'idx_user_scores_updated_at',
    'idx_user_scores_user_id_updated_at',
    'idx_items_sort_order',
    'idx_levels_sort_order',
    'idx_lessons_level_sort_order',
    'idx_user_items_user_updated',
    'idx_items_updated_sort_order'
  )
ORDER BY indexname;

-- 6) Quick data sanity checks (counts)
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM public.users
UNION ALL
SELECT 'grammar', COUNT(*) FROM public.grammar
UNION ALL
SELECT 'levels', COUNT(*) FROM public.levels
UNION ALL
SELECT 'lessons', COUNT(*) FROM public.lessons
UNION ALL
SELECT 'items', COUNT(*) FROM public.items
UNION ALL
SELECT 'user_items', COUNT(*) FROM public.user_items
UNION ALL
SELECT 'user_scores', COUNT(*) FROM public.user_scores;
