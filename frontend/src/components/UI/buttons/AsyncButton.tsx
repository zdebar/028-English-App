import RectangularButton from "@/components/UI/buttons/RectangularButton";
import { Modal } from "@/components/UI/Modal";
import { useState } from "react";

interface AsyncButtonProps {
  isLoading: boolean;
  message: string;
  disabledMessage?: string;
  buttonTextStyle?: string;
  modalTitle?: string;
  modalDescription?: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}

export default function AsyncButton({
  isLoading,
  message,
  disabledMessage = "Načítání...",
  modalTitle = "Potvrzení akce",
  modalDescription = "Opravdu chcete pokračovat?",
  onConfirm,
  buttonTextStyle = "text-button",
  disabled = false,
  className = "",
}: AsyncButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <RectangularButton
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading || disabled}
        className={className}
      >
        <p className={`overlay-hidden ${buttonTextStyle}`}>
          {isLoading ? disabledMessage : message}
        </p>
      </RectangularButton>
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
