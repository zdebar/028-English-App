-- Remove daily progress history. The previous migration is kept immutable, so this
-- migration removes the deployed table and its RPC endpoints explicitly.
DROP FUNCTION IF EXISTS public.upsert_fetch_user_item_progress_history(UUID, TIMESTAMPTZ, JSONB);
DROP FUNCTION IF EXISTS public.upsert_user_item_progress_history(JSONB);
DROP TABLE IF EXISTS public.user_item_progress_history;
