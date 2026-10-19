BEGIN;

ALTER TABLE public.users
  ADD COLUMN max_new_lessons_per_day INTEGER NOT NULL DEFAULT 1
    CHECK (max_new_lessons_per_day >= 1);

CREATE TABLE public.user_lessons (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, lesson_id, started_at)
);

CREATE INDEX idx_user_lessons_user_started_at
  ON public.user_lessons (user_id, started_at);

REVOKE ALL PRIVILEGES ON TABLE public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT UPDATE (max_new_lessons_per_day) ON TABLE public.users TO authenticated;

DROP POLICY IF EXISTS users_update_own_settings ON public.users;
CREATE POLICY users_update_own_settings ON public.users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) AND public.is_non_demo_user())
  WITH CHECK (id = (SELECT auth.uid()) AND public.is_non_demo_user());

REVOKE ALL PRIVILEGES ON TABLE public.user_lessons FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.user_lessons TO authenticated;
ALTER TABLE public.user_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_lessons_select_own ON public.user_lessons;
DROP POLICY IF EXISTS user_lessons_insert_own ON public.user_lessons;
CREATE POLICY user_lessons_select_own ON public.user_lessons
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY user_lessons_insert_own ON public.user_lessons
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_non_demo_user());

COMMIT;
