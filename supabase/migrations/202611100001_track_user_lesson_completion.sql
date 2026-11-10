BEGIN;

ALTER TABLE public.user_lessons
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Force existing lesson history through one update-timestamp sync after rollout.
UPDATE public.user_lessons
SET updated_at = NOW()
WHERE updated_at IS NULL;

ALTER TABLE public.user_lessons
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_lessons_user_updated_at
  ON public.user_lessons (user_id, updated_at);

DROP TRIGGER IF EXISTS trg_set_updated_at__user_lessons ON public.user_lessons;
CREATE TRIGGER trg_set_updated_at__user_lessons
BEFORE UPDATE ON public.user_lessons
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL PRIVILEGES ON TABLE public.user_lessons FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_lessons TO authenticated;

DROP POLICY IF EXISTS user_lessons_update_own_non_demo ON public.user_lessons;
CREATE POLICY user_lessons_update_own_non_demo ON public.user_lessons
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND public.is_non_demo_user())
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.is_non_demo_user());

COMMIT;
