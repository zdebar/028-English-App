import { useState } from "react";
import { Modal } from "@/components/modal";
import UserItem from "@/database/models/user-items";
import ButtonRectangular from "@/components/button-rectangular";

export default function ButtonResetAll() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    try {
      await UserItem.clearAllUserItems();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error clearing all user items:", error);
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
      >
        <h2 id="reset-modal-title">Potvrzení resetu</h2>
        <p id="reset-modal-description">
          Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit.
        </p>
      </Modal>
    </>
  );
}
