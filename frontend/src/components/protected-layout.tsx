import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  const { userId, loading } = useAuth();

  if (loading) {
    return <div>Načítání...</div>;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
