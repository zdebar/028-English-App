CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar ON public.grammar;
CREATE TRIGGER trg_set_updated_at__grammar
BEFORE UPDATE ON public.grammar
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__levels ON public.levels;
CREATE TRIGGER trg_set_updated_at__levels
BEFORE UPDATE ON public.levels
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__lessons ON public.lessons;
CREATE TRIGGER trg_set_updated_at__lessons
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__items ON public.items;
CREATE TRIGGER trg_set_updated_at__items
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_items ON public.user_items;
CREATE TRIGGER trg_set_updated_at__user_items
BEFORE UPDATE ON public.user_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_scores ON public.user_scores;
CREATE TRIGGER trg_set_updated_at__user_scores
BEFORE UPDATE ON public.user_scores
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();



