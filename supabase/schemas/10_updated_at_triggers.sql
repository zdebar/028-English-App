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

CREATE OR REPLACE FUNCTION private.validate_group_relation_types()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, private
AS $$
DECLARE parent_type TEXT;
DECLARE child_type TEXT;
BEGIN
  SELECT type INTO parent_type FROM public.groups WHERE id = NEW.parent_group_id;
  SELECT type INTO child_type FROM public.groups WHERE id = NEW.child_group_id;
  IF NOT (
    (parent_type = 'grammar' AND child_type = 'grammar' AND NEW.relation_type IN ('hierarchy', 'detail'))
    OR (parent_type = 'topic' AND child_type = 'topic' AND NEW.relation_type = 'hierarchy')
    OR (parent_type = 'pronunciation' AND child_type = 'sound' AND NEW.relation_type = 'contrast')
  ) THEN
    RAISE EXCEPTION 'Invalid group relation: % -> % (%)', parent_type, child_type, NEW.relation_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_group_relation_types ON public.group_relations;
CREATE TRIGGER trg_validate_group_relation_types
BEFORE INSERT OR UPDATE OF parent_group_id, child_group_id, relation_type
ON public.group_relations
FOR EACH ROW EXECUTE FUNCTION private.validate_group_relation_types();

DROP TRIGGER IF EXISTS trg_set_updated_at__settings ON private.settings;
CREATE TRIGGER trg_set_updated_at__settings
BEFORE UPDATE ON private.settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__groups ON public.groups;
CREATE TRIGGER trg_set_updated_at__groups BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__group_items ON public.group_items;
CREATE TRIGGER trg_set_updated_at__group_items BEFORE UPDATE ON public.group_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__group_relations ON public.group_relations;
CREATE TRIGGER trg_set_updated_at__group_relations BEFORE UPDATE ON public.group_relations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at__users ON public.users;
CREATE TRIGGER trg_set_updated_at__users
BEFORE UPDATE ON public.users
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

DROP TRIGGER IF EXISTS trg_set_updated_at__user_items ON public.user_items;
CREATE TRIGGER trg_set_updated_at__user_items
BEFORE UPDATE ON public.user_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

