import { useAuthStore } from "@/hooks/use-auth-store";
import { Navigate, Outlet } from "react-router-dom";
import Loading from "@/components/UI/loading";

export default function ProtectedLayout() {
  const { userId, loading } = useAuthStore();

  if (loading) {
    return <Loading />;
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
