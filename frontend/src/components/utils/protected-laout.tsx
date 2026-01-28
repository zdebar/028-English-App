import { useAuthStore } from '@/features/auth/use-auth-store';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Layout component that protects routes by checking user authentication.
 */
export default function ProtectedLayout() {
  const userId = useAuthStore((state) => state.userId);

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
