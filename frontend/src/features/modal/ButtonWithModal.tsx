import config from '@/config/config';
import { Modal } from '@/features/modal/Modal';
import { useMinLoading } from '@/features/modal/use-min-loading';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useState } from 'react';

interface ButtonModalProps {
  onConfirm?: () => Promise<void> | void;
  modalTitle?: string;
  modalText?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component that displays a confirmation modal before executing an action.
 * Automatically disables button while executing onConfirm action.
 * Provide children to customize modal content.
 *
 * @param onConfirm Function to call when action is confirmed. Should handle its own errors.
 * @param modalTitle Title to display in the confirmation modal.
 * @param modalText Description to display in the confirmation modal.
 * @param disabled Whether the button is disabled.
 * @param className Additional CSS classes for custom styling.
 * @param children Content to display inside the button.
 * @return The ButtonWithModal component.
 */
export default function ButtonWithModal({
  onConfirm,
  modalTitle = TEXTS.modalTitle,
  modalText = TEXTS.modalText,
  disabled = false,
  children,
  className = '',
}: ButtonModalProps): JSX.Element {
  const [showModal, setShowModal] = useState(false);
  const { isLoading, setIsLoading } = useMinLoading(config.buttons.minLoadingTime);

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled || isLoading}
        className={`button-rectangular button-color ${className}`}
      >
        {children}
      </button>
      {showModal && (
        <Modal
          onConfirm={async () => {
            if (onConfirm) await handleConfirm();
          }}
          onClose={() => setShowModal(false)}
        >
          <p className="font-bold">{modalTitle}</p>
          <p>{modalText}</p>
        </Modal>
      )}
    </>
  );
}
