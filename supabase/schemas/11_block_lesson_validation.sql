CREATE OR REPLACE FUNCTION public.require_item_block_lesson()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_lesson_id INTEGER;
BEGIN
  SELECT lesson_id INTO v_lesson_id
  FROM public.blocks
  WHERE id = NEW.block_id;

  IF v_lesson_id IS NULL THEN
    RAISE EXCEPTION 'Cannot assign item % to block % without a lesson', NEW.id, NEW.block_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_require_item_block_lesson
BEFORE INSERT OR UPDATE OF block_id ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.require_item_block_lesson();

CREATE OR REPLACE FUNCTION public.prevent_nonempty_block_lesson_clear()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF NEW.lesson_id IS NULL
    AND EXISTS (SELECT 1 FROM public.items WHERE block_id = NEW.id)
  THEN
    RAISE EXCEPTION 'Cannot clear lesson from non-empty block %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_nonempty_block_lesson_clear
BEFORE UPDATE OF lesson_id ON public.blocks
FOR EACH ROW
EXECUTE FUNCTION public.prevent_nonempty_block_lesson_clear();
