import { useState } from "react";
import UserItem from "@/database/models/user-items";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ButtonAsyncModal from "../../components/UI/buttons/ButtonAsyncModal";
import { useAuthStore } from "@/features/auth/use-auth-store";

export default function ResetAllButton() {
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
    <ButtonAsyncModal
      message="Resetovat vše"
      loadingMessage="Probíhá resetování..."
      isLoading={isLoading}
      modalTitle="Potvrzení resetu"
      modalDescription="Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit."
      onConfirm={handleReset}
      className="grow-0 shape-button-rectangular color-button "
    />
  );
}
