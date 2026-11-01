BEGIN;

DROP POLICY IF EXISTS users_update_own_settings ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS "Enable users to view their own data only" ON public.users;
REVOKE ALL PRIVILEGES ON TABLE public.users FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (max_new_lessons_per_day) ON TABLE public.users FROM authenticated;
ALTER TABLE public.users DROP COLUMN IF EXISTS max_new_lessons_per_day;
DROP INDEX IF EXISTS public.idx_user_lessons_user_started_at;

COMMIT;
