import config from '@/config/config';
import { Modal } from '@/features/modal/Modal';
import { useMinLoading } from '@/features/modal/use-min-loading';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useState } from 'react';

interface ButtonModalProps {
  buttonText: string;
  onConfirm?: () => Promise<void> | void;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component that displays a confirmation modal before executing an action.
 * Automatically disables button while executing onConfirm action.
 * Provide children to customize modal content.
 *
 * @param buttonText Text to display on the button.
 * @param onConfirm Function to call when action is confirmed.
 * @param loadingText Text to display while loading.
 * @param disabled Whether the button is disabled.
 * @param className Additional CSS classes for custom styling.
 * @param children Content to display inside the modal.
 * @return The ButtonWithModal component.
 * @throws Any error thrown by onConfirm will propagate to the caller.
 */
export default function ButtonWithModal({
  buttonText,
  onConfirm,
  loadingText = TEXTS.loadingText,
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
        onClick={() => setShowModal(true)}
        disabled={disabled || isLoading}
        className={`button-rectangular button-color ${className}`}
      >
        <span>{isLoading ? loadingText : buttonText}</span>
      </button>
      {showModal && (
        <Modal
          onConfirm={async () => {
            if (onConfirm) await handleConfirm();
          }}
          onClose={() => setShowModal(false)}
        >
          {children}
        </Modal>
      )}
    </>
  );
}
