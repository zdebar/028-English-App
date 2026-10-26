BEGIN;

DO $$
DECLARE
  flap_sort_order INTEGER;
BEGIN
  SELECT MIN(sort_order)
  INTO flap_sort_order
  FROM public.groups
  WHERE type = 'sound'
    AND name = 'ɾ'
    AND deleted_at IS NULL;

  IF flap_sort_order IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.groups
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE type = 'sound'
    AND name = 'ɾ'
    AND deleted_at IS NULL;

  UPDATE public.groups
  SET sort_order = sort_order - 1,
      updated_at = NOW()
  WHERE type = 'sound'
    AND deleted_at IS NULL
    AND sort_order > flap_sort_order;
END;
$$;

COMMIT;
