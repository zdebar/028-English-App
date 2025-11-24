import { useState } from "react";
import UserItem from "@/database/models/user-items";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ButtonAsync from "./button-async";
import { useAuthStore } from "@/hooks/use-auth-store";

/**
 * Button for resetting all user progress.
 */
export default function ButtonResetAll() {
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuthStore();

  const handleReset = async () => {
    setIsLoading(true);
    try {
      if (!userId) return;
      if (await UserItem.resetsAllUserItems(userId)) {
        toast.success("Váš pokrok byl úspěšně resetován.");
      } else {
        toast.info("Žádný pokrok k resetování.");
      }
    } catch (error) {
      console.error("Error clearing all user items:", error);
      toast.error(
        "Nastala chyba při resetování pokroku. Zkuste to prosím později."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsync
      isLoading={isLoading}
      message="Resetovat vše"
      modalTitle="Potvrzení resetu"
      modalDescription="Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit."
      onConfirm={handleReset}
      disabled={false}
      className="grow-0"
    />
  );
}
