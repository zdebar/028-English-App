import { useState } from "react";
import { toast } from "react-toastify";
import ButtonAsyncModal from "./ButtonAsyncModal";
import { useAuthStore } from "@/hooks/use-auth-store";

/**
 * Button for signing out the user.
 */
export default function SignoutButton() {
  const { handleLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignout = async () => {
    setIsLoading(true);
    try {
      await handleLogout();
      toast.success("Úspěšně jste se odhlásili.");
    } catch (error) {
      console.error("Error on user logout:", error);
      toast.error("Nastala chyba při odhlašování. Zkuste to prosím později.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      message="Odhlásit se"
      isLoading={isLoading}
      loadingMessage="Probíhá odhlašování..."
      modalTitle="Potvrzení odhlášení"
      modalDescription="Opravdu se chcete odhlásit?"
      onConfirm={handleSignout}
      className="grow-0 shape-button-rectangular color-button "
    />
  );
}
