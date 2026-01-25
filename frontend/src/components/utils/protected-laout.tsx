import { useAuthStore } from '@/features/auth/use-auth-store';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingText from '@/components/UI/LoadingText';

/**
 * Layout component that protects routes by checking user authentication.
 */
export default function ProtectedLayout() {
  const { userId, loading } = useAuthStore();

  if (loading) {
    return <LoadingText />;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
