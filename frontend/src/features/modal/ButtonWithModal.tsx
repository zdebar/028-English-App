import { Modal } from '@/features/modal/Modal';
import { TEXTS } from '@/config/texts.config';
import { useModalStore } from './use-modal-store';
import { useMinLoading } from '@/features/modal/use-min-loading';
import config from '@/config/config';
import type { JSX } from 'react';

interface ButtonModalProps {
  buttonText: string;
  onConfirm?: () => Promise<void> | void;
  loadingText?: string;
  disabled?: boolean;
  modalTitle?: string;
  modalDescription?: string;
  className?: string;
}

/**
 * Button component that displays a confirmation modal before executing an action.
 * Automatically disables button while executing onConfirm action.
 *
 * @param buttonText Text to display on the button.
 * @param onConfirm Function to call when action is confirmed.
 * @param loadingText Text to display while loading.
 * @param disabled Whether the button is disabled.
 * @param modalTitle Title of the confirmation modal.
 * @param modalDescription Description in the confirmation modal.
 * @param className Additional CSS classes for custom styling.
 * @return {JSX.Element} The ButtonWithModal component.
 * @throws Any error thrown by onConfirm will propagate to the caller.
 */
export default function ButtonWithModal({
  buttonText,
  onConfirm,
  loadingText = TEXTS.buttonLoading,
  disabled = false,
  modalTitle = TEXTS.modalConfirmTitle,
  modalDescription = TEXTS.modalConfirmDescription,
  className = '',
}: ButtonModalProps): JSX.Element {
  const openModal = useModalStore((state) => state.openModal);
  const isModalOpen = useModalStore((state) => state.isModalOpened);
  const { isLoading, setIsLoading } = useMinLoading(config.buttons.minLoadingTime);

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
      } catch (error) {
        console.error('Error in ButtonWithModal onConfirm:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => openModal()}
        disabled={disabled || isLoading}
        className={`button-rectangular button-color ${className}`}
      >
        <span>{isLoading ? loadingText : buttonText}</span>
      </button>
      {isModalOpen && (
        <Modal
          onConfirm={async () => {
            if (onConfirm) await handleConfirm();
          }}
          title={modalTitle}
          description={modalDescription}
        />
      )}
    </>
  );
}
