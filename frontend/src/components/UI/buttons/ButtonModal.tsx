import { Modal } from '@/components/UI/Modal';
import { TEXTS } from '@/config/texts';
import { useState } from 'react';
import ButtonLoading from './ButtonLoading';

interface ButtonModalProps {
  label: string;
  onConfirm?: () => Promise<void>;
  loadingLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  className?: string;
}

/**
 * Button component that displays a confirmation modal before executing an action.
 * Automatically disables button while executing onConfirm action.
 *
 * @param label Text to display on the button.
 * @param onConfirm Function to call when action is confirmed.
 * @param isLoading Whether the button is in loading state.
 * @param loadingLabel Text to display while loading.
 * @param disabled Whether the button is disabled.
 * @param modalTitle Title of the confirmation modal.
 * @param modalDescription Description in the confirmation modal.
 * @param className Additional CSS classes for custom styling.
 */
export default function ButtonModal({
  label,
  onConfirm,
  isLoading = false,
  loadingLabel = TEXTS.buttonLoading,
  disabled = false,
  modalTitle = TEXTS.modalConfirmTitle,
  modalDescription = TEXTS.modalConfirmDescription,
  className = '',
}: ButtonModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ButtonLoading
        isLoading={isLoading}
        label={label}
        disabled={disabled}
        loadingLabel={loadingLabel}
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
