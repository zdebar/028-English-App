import { useState } from "react";
import ButtonAsync from "./ButtonAsync";
import { Modal } from "@/components/UI/Modal";

interface ButtonAsyncModalProps {
  message: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  loadingMessage?: string;
  modalTitle?: string;
  modalDescription?: string;
  className?: string;
}

/**
 * Button component that displays a confirmation modal before executing an action.
 *
 * @param message The button label.
 * @param onConfirm Function called when the action is confirmed in the modal.
 * @param isLoading Controls the loading state of the button.
 * @param disabled Disables the button if true.
 * @param loadingMessage The label shown while loading (default: "Načítání...").
 * @param modalTitle The title of the confirmation modal (default: "Potvrzení akce").
 * @param modalDescription The description/message in the modal (default: "Opravdu chcete pokračovat?").
 * @param className Additional CSS classes for custom styling.
 * @returns A button with confirmation modal and loading feedback.
 */
export default function ButtonAsyncModal({
  message,
  onConfirm,
  isLoading = false,
  disabled = false,
  loadingMessage = "Načítání...",
  modalTitle = "Potvrzení akce",
  modalDescription = "Opravdu chcete pokračovat?",
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
