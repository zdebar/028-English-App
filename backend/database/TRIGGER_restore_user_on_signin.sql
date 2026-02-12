CREATE OR REPLACE FUNCTION public.restore_user_on_signin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Fully-qualified table reference and fixed search_path ensure deterministic resolution
  UPDATE public.users
  SET deleted_at = NULL
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;