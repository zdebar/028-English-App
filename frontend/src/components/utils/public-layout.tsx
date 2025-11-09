import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router-dom";

export default function PublicLayout() {
  const { userId } = useAuth();

  if (userId) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
