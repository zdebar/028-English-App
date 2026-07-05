ALTER FUNCTION public.reactivate_user_if_deleted()
RENAME TO restore_current_user_if_deleted;

REVOKE EXECUTE ON FUNCTION public.restore_current_user_if_deleted() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_current_user_if_deleted() TO authenticated;
