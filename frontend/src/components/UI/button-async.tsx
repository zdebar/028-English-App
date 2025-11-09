import ButtonRectangular from "@/components/UI/button-rectangular";
import { Modal } from "@/components/UI/modal";

import { useState } from "react";

interface ButtonAsyncProps {
  isLoading: boolean;
  message: string;
  disabledMessage: string;
  modalTitle?: string;
  modalDescription?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export default function ButtonAsync({
  isLoading,
  message,
  disabledMessage,
  modalTitle = "Potvrzení akce",
  modalDescription = "Opravdu chcete pokračovat?",
  onConfirm,
  disabled = false,
}: ButtonAsyncProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ButtonRectangular
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading || disabled}
      >
        <p className="text-button">{isLoading ? disabledMessage : message}</p>
      </ButtonRectangular>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          setIsModalOpen(false);
          onConfirm();
        }}
        title={modalTitle}
        description={modalDescription}
      />
    </>
  );
}
