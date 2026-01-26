import { useKey } from '@/hooks/use-key';

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked.
 */
export default function OverlayMask({ onClose }: { onClose?: () => void }) {
  useKey({ onKeyPress: close, keys: ['Escape'] });

  return (
    <div
      className="bg-overlay z-overlay pointer-events-auto fixed inset-0 top-0"
      onClick={onClose}
      role="button"
      tabIndex={0}
    />
  );
}
