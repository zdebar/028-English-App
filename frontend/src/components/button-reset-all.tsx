import { useState } from "react";
import { Modal } from "@/components/modal";
import UserItem from "@/database/models/user-items";
import ButtonRectangular from "@/components/button-rectangular";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Button for resetting all user progress.
 */
export default function ButtonResetAll() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    try {
      await UserItem.clearAllUserItems();
      toast.success("Váš pokrok byl úspěšně resetován.");
      setIsModalOpen(false);
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
    <>
      <ButtonRectangular onClick={() => setIsModalOpen(true)}>
        {isLoading ? "Načítání..." : "Restartovat"}
      </ButtonRectangular>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleReset}
        aria-labelledby="reset-modal-title"
        aria-describedby="reset-modal-description"
        title="Potvrzení resetu"
        description="Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit."
      />
    </>
  );
}
