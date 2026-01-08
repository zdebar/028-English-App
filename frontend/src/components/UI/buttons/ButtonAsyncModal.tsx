import { useState } from 'react';
import ButtonAsync from './ButtonAsync';
import { Modal } from '@/components/UI/Modal';

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
 */
export default function ButtonAsyncModal({
  message,
  onConfirm,
  isLoading = false,
  disabled = false,
  loadingMessage = 'Načítání...',
  modalTitle = 'Potvrzení akce',
  modalDescription = 'Opravdu chcete pokračovat?',
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
