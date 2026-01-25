import { useAuthStore } from '@/features/auth/use-auth-store';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingMessage from '@/components/UI/LoadingMessage';

/**
 * Layout component that protects routes by checking user authentication.
 */
export default function ProtectedLayout() {
  const { userId, loading } = useAuthStore();

  if (loading) {
    return <LoadingMessage />;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
