import { useState } from "react";
import AsyncButton from "./AsyncButton";
import { Modal } from "@/components/UI/Modal";

interface AsyncButtonWithModalProps {
  isLoading: boolean;
  message: string;
  disabled?: boolean;
  disabledMessage?: string;
  modalTitle?: string;
  modalDescription?: string;
  onConfirm: () => void;
  className?: string;
}

export default function AsyncButtonWithModal({
  isLoading,
  message,
  disabled = false,
  disabledMessage = "Načítání...",
  modalTitle = "Potvrzení akce",
  modalDescription = "Opravdu chcete pokračovat?",
  onConfirm,
  className = "",
}: AsyncButtonWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <AsyncButton
        isLoading={isLoading}
        message={message}
        disabled={disabled}
        loadingMessage={disabledMessage}
        onClick={() => setIsModalOpen(true)}
        className={className}
      />
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
