import { useAuthStore } from "@/features/auth/use-auth-store";
import { Navigate, Outlet } from "react-router-dom";
import Loading from "@/components/UI/Loading";

export default function PublicLayout() {
  const { userId, loading } = useAuthStore();

  if (loading) {
    return <Loading />;
  }

  if (userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
