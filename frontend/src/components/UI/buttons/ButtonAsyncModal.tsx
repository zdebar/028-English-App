import { Modal } from '@/components/UI/Modal';
import { TEXTS } from '@/config/texts';
import { useState } from 'react';
import ButtonAsync from './ButtonAsync';

interface ButtonAsyncModalProps {
  buttonTitle: string;
  onConfirm?: () => Promise<void>;
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
 * @param buttonTitle Text to display on the button.
 * @param onConfirm Function to call when action is confirmed.
 * @param isLoading Whether the button is in loading state.
 * @param disabled Whether the button is disabled.
 * @param loadingMessage Text to display while loading.
 * @param modalTitle Title of the confirmation modal.
 * @param modalDescription Description in the confirmation modal.
 * @param className Additional CSS classes for custom styling.
 */
export default function ButtonAsyncModal({
  buttonTitle: message,
  onConfirm,
  isLoading = false,
  disabled = false,
  loadingMessage = TEXTS.buttonLoading,
  modalTitle = TEXTS.modalConfirmTitle,
  modalDescription = TEXTS.modalConfirmDescription,
  className = '',
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
        showModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={async () => {
          setIsModalOpen(false);
          if (onConfirm) await onConfirm();
        }}
        title={modalTitle}
        description={modalDescription}
      />
    </>
  );
}
