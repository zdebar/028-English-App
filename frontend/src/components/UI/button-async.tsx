import ButtonRectangular from "@/components/UI/button-rectangular";
import { Modal } from "@/components/UI/modal";
import { useState } from "react";
import Loading from "./loading";

interface ButtonAsyncProps {
  isLoading: boolean;
  message: string;
  disabledMessage: string;
  buttonTextStyle?: string;
  modalTitle?: string;
  modalDescription?: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ButtonAsync({
  isLoading,
  message,
  disabledMessage,
  modalTitle = "Potvrzení akce",
  modalDescription = "Opravdu chcete pokračovat?",
  onConfirm,
  buttonTextStyle = "text-button",
  disabled = false,
  className = "",
}: ButtonAsyncProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ButtonRectangular
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading || disabled}
        className={className}
      >
        <p className={`overlay-hidden ${buttonTextStyle}`}>
          {disabled ? disabledMessage : isLoading ? <Loading /> : message}
        </p>
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
