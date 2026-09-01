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

DROP TRIGGER IF EXISTS trg_set_updated_at__settings ON private.settings;
CREATE TRIGGER trg_set_updated_at__settings
BEFORE UPDATE ON private.settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__users ON public.users;
CREATE TRIGGER trg_set_updated_at__users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar_groups ON public.grammar_groups;
CREATE TRIGGER trg_set_updated_at__grammar_groups
BEFORE UPDATE ON public.grammar_groups
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar_chunks ON public.grammar_chunks;
CREATE TRIGGER trg_set_updated_at__grammar_chunks
BEFORE UPDATE ON public.grammar_chunks
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

DROP TRIGGER IF EXISTS trg_set_updated_at__blocks ON public.blocks;
CREATE TRIGGER trg_set_updated_at__blocks
BEFORE UPDATE ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__topics ON public.topics;
CREATE TRIGGER trg_set_updated_at__topics
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__notes ON public.notes;
CREATE TRIGGER trg_set_updated_at__notes
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__items ON public.items;
CREATE TRIGGER trg_set_updated_at__items
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__pronunciation_groups
  ON public.pronunciation_groups;
CREATE TRIGGER trg_set_updated_at__pronunciation_groups
BEFORE UPDATE ON public.pronunciation_groups
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__pronunciation_group_items
  ON public.pronunciation_group_items;
CREATE TRIGGER trg_set_updated_at__pronunciation_group_items
BEFORE UPDATE ON public.pronunciation_group_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__grammar_chunk_examples
  ON public.grammar_chunk_examples;
CREATE TRIGGER trg_set_updated_at__grammar_chunk_examples
BEFORE UPDATE ON public.grammar_chunk_examples
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__user_items ON public.user_items;
CREATE TRIGGER trg_set_updated_at__user_items
BEFORE UPDATE ON public.user_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

