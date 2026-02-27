CREATE OR REPLACE FUNCTION public.restore_user_on_signin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  UPDATE public.users
  SET deleted_at = NULL
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;