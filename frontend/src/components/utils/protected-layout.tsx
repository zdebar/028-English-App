import DelayedNotification from '@/components/UI/DelayedNotification';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Layout component that protects routes by checking user authentication.
 */
export default function ProtectedLayout() {
  const userId = useAuthStore((state) => state.userId);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <DelayedNotification className="mt-20" />;
  }

  if (!userId) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
