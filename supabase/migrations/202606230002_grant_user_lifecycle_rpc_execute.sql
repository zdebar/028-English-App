REVOKE EXECUTE ON FUNCTION public.soft_delete_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_user() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reactivate_user_if_deleted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reactivate_user_if_deleted() TO authenticated;
