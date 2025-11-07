import { useState } from "react";
import { Modal } from "@/components/modal";
import UserItem from "@/database/models/user-items";
import ButtonRectangular from "@/components/button-rectangular";

export default function ButtonResetAll() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReset = async () => {
    await UserItem.clearAllUserItems();
    setIsModalOpen(false);
  };

  return (
    <>
      <ButtonRectangular onClick={() => setIsModalOpen(true)}>
        Restarovat
      </ButtonRectangular>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleReset}
      >
        <p>Opravdu chcete vymazat veškerý progress?</p>
        <p>Změna již nepůjde vrátit.</p>
      </Modal>
    </>
  );
}
