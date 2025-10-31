import ButtonRectangular from "./button-rectangular";
import { useAuth } from "@/hooks/use-auth";

export default function ButtonSignout() {
  const { handleLogout } = useAuth();

  return <ButtonRectangular onClick={handleLogout}>Sign out</ButtonRectangular>;
}
