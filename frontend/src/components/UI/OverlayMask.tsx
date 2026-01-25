import { useKey } from '@/hooks/use-key';

type OverlayMaskProps = {
  onClose?: () => void;
};

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked.
 */
export default function OverlayMask({ onClose = () => {} }: OverlayMaskProps) {
  useKey(onClose, ['Escape']);

  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="bg-overlay pointer-events-auto fixed inset-0 top-0 z-1000"
      onClick={handleOverlayClick}
      role="button"
      tabIndex={0}
    />
  );
}
