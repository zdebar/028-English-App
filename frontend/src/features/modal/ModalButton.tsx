import { MenuButton } from '@/components/UI/buttons/MenuButton';
import config from '@/config/config';
import { Modal } from '@/features/modal/Modal';
import { useMinLoading } from '@/features/modal/use-min-loading';
import { TEXTS } from '@/locales/cs';
import type { JSX, ReactNode } from 'react';
import { useCallback, useState } from 'react';

interface ModalButtonProps {
  onConfirm?: () => Promise<void> | void;
  modalTitle?: string;
  modalText?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Button component that displays a confirmation modal before executing an action.
 * Automatically disables button while executing onConfirm action.
 * Provide children to customize modal content.
 *
 * @param onConfirm Function to call when action is confirmed. Should handle its own errors.
 * @param modalTitle Title to display in the confirmation modal.
 * @param modalText Description to display in the confirmation modal.
 * @param title Text to display on the button. If children are provided, this will be ignored.
 * @param disabled Whether the button is disabled.
 * @param className Additional CSS classes for custom styling.
 * @param children Content to display inside the button. Should be inline elements or text (not block elements like <p>, <div>, etc.) to ensure proper styling.
 * @return The ModalButton component.
 */
export default function ModalButton({
  onConfirm,
  modalTitle = TEXTS.modalTitle,
  modalText = TEXTS.modalText,
  disabled = false,
  title = '',
  children,
  className = '',
}: ModalButtonProps): JSX.Element {
  const [showModal, setShowModal] = useState(false);
  const { isLoading, setIsLoading } = useMinLoading(config.buttons.minLoadingTime);
  const isDisabled = disabled || isLoading;

  const handleConfirm = useCallback(async () => {
    if (!onConfirm) return;

    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, setIsLoading]);

  return (
    <>
      <MenuButton
        onClick={() => setShowModal(true)}
        title={title}
        disabled={isDisabled}
        className={`${className}`}
      >
        {children}
      </MenuButton>
      {showModal && (
        <Modal onConfirm={handleConfirm} onClose={() => setShowModal(false)}>
          <p className="font-bold">{modalTitle}</p>
          <p>{modalText}</p>
        </Modal>
      )}
    </>
  );
}
