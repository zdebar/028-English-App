import { useState } from "react";
import ButtonAsync from "./ButtonAsync";
import { Modal } from "@/components/UI/Modal";

interface ButtonAsyncModalProps {
  message: string;
  disabled?: boolean;
  isLoading: boolean;
  loadingMessage?: string;
  modalTitle?: string;
  modalDescription?: string;
  onConfirm?: () => void;
  className?: string;
}

export default function ButtonAsyncModal({
  isLoading,
  message,
  disabled = false,
  loadingMessage = "Načítání...",
  modalTitle = "Potvrzení akce",
  modalDescription = "Opravdu chcete pokračovat?",
  onConfirm,
  className = "",
}: ButtonAsyncModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ButtonAsync
        isLoading={isLoading}
        message={message}
        disabled={disabled}
        loadingMessage={loadingMessage}
        onClick={() => setIsModalOpen(true)}
        className={className}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          setIsModalOpen(false);
          if (onConfirm) onConfirm();
        }}
        title={modalTitle}
        description={modalDescription}
      />
    </>
  );
}
