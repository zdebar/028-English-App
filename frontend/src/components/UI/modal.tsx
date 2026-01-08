import Button from './buttons/Button';
import OverlayMask from '@/components/UI/OverlayMask';

type ModalProps = {
  showModal: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  description: string;
};

/**
 * Modal component for confirmation dialogs.
 */
export function Modal({ showModal, onConfirm, onClose, title, description }: ModalProps) {
  if (!showModal) {
    return null;
  }

  return (
    <>
      <OverlayMask onClose={onClose} />
      <div className="fixed inset-0 z-1001 flex items-center justify-center">
        <div className="card-width flex min-h-40 flex-col justify-between">
          <div className="color-base flex grow flex-col items-center gap-2 p-4 text-center">
            <p className="font-bold">{title}</p>
            <p>{description}</p>
          </div>
          <div className="flex gap-1">
            <Button onClick={onClose}>Ne</Button>
            <Button onClick={onConfirm}>Ano</Button>
          </div>
        </div>
      </div>
    </>
  );
}
