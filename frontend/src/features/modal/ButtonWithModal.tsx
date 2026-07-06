import { StandardButton } from '@/components/UI/buttons/StandardButton';
import config from '@/config/config';
import { Modal } from '@/features/modal/Modal';
import { useMinLoading } from '@/features/modal/use-min-loading';
import { TEXTS } from '@/locales/cs';
import type { JSX, ReactNode } from 'react';
import { useCallback, useState } from 'react';

type ButtonWithModalProps = Readonly<{
  /** Action executed after confirmation; the button remains loading for at least the configured minimum time. */
  onConfirm?: () => Promise<void> | void;
  /** Confirmation modal title; defaults to the shared modal title text. */
  modalTitle?: string;
  /** Confirmation modal body text; defaults to the shared modal text. */
  modalText?: string;
  /** Tooltip/title applied to the trigger button. */
  title?: string;
  /** Disables the trigger button; loading state also disables it. */
  disabled?: boolean;
  /** Keeps normal text color while disabled for buttons that should look visually active. */
  preserveEnabledTextColorWhenDisabled?: boolean;
  /** Extra classes appended to the trigger button. */
  className?: string;
  /** Trigger button content; keep it inline to preserve button layout. */
  children?: ReactNode;
}>;

export default function ButtonWithModal({
  onConfirm,
  modalTitle = TEXTS.modalTitle,
  modalText = TEXTS.modalText,
  disabled = false,
  title = '',
  preserveEnabledTextColorWhenDisabled = false,
  children,
  className = '',
}: ButtonWithModalProps): JSX.Element {
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
      <StandardButton
        onClick={() => setShowModal(true)}
        title={title}
        disabled={isDisabled}
          className={[
            className,
          preserveEnabledTextColorWhenDisabled ? 'preserve-disabled-text-color' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </StandardButton>
      {showModal && (
        <Modal onConfirm={handleConfirm} onClose={() => setShowModal(false)}>
          <p className="font-bold">{modalTitle}</p>
          <p>{modalText}</p>
        </Modal>
      )}
    </>
  );
}
