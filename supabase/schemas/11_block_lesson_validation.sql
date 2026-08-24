CREATE OR REPLACE FUNCTION public.validate_explicit_block_items()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
  v_block_id INTEGER;
  v_block_ids INTEGER[];
  v_lesson_id INTEGER;
  v_member_count INTEGER;
  v_range_count INTEGER;
  v_min_sort INTEGER;
  v_max_sort INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_block_ids := ARRAY[NEW.block_id];
  ELSIF TG_OP = 'DELETE' THEN
    v_block_ids := ARRAY[OLD.block_id];
  ELSE
    v_block_ids := ARRAY[OLD.block_id, NEW.block_id];
  END IF;

  FOREACH v_block_id IN ARRAY v_block_ids LOOP
    IF v_block_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT MIN(lesson_id), COUNT(DISTINCT lesson_id), MIN(sort_order), MAX(sort_order), COUNT(*)
      INTO v_lesson_id, v_range_count, v_min_sort, v_max_sort, v_member_count
    FROM public.items
    WHERE block_id = v_block_id;

    IF v_member_count = 0 THEN
      CONTINUE;
    END IF;

    IF v_range_count <> 1 THEN
      RAISE EXCEPTION 'Explicit block % contains items from multiple lessons', v_block_id;
    END IF;

    SELECT COUNT(*) INTO v_range_count
    FROM public.items
    WHERE lesson_id = v_lesson_id
      AND sort_order BETWEEN v_min_sort AND v_max_sort;

    IF v_range_count <> v_member_count THEN
      RAISE EXCEPTION 'Explicit block % items are not contiguous in lesson %', v_block_id, v_lesson_id;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_validate_explicit_block_items
AFTER INSERT OR DELETE OR UPDATE OF block_id, lesson_id, sort_order ON public.items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.validate_explicit_block_items();
