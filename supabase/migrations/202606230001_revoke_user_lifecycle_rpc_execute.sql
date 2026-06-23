REVOKE EXECUTE ON FUNCTION public.soft_delete_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reactivate_user_if_deleted() FROM PUBLIC, anon, authenticated;
