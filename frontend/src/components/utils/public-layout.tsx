import { useAuthStore } from "@/hooks/use-auth-store";
import { Navigate, Outlet } from "react-router-dom";

export default function PublicLayout() {
  const { userId } = useAuthStore();

  if (userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
