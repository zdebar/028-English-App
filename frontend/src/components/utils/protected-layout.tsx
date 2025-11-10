import { useAuthStore } from "@/hooks/use-auth-store";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  const { userId, loading } = useAuthStore();

  if (loading) {
    return <div>Načítání...</div>;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
