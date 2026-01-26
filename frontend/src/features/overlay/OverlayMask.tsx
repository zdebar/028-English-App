import { useKey } from '@/hooks/use-key';
import { useOverlayStore } from './use-overlay-store';

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked.
 */
export default function OverlayMask() {
  const close = useOverlayStore((state) => state.closeOverlay);
  useKey({ onKeyPress: close, keys: ['Escape'] });

  return (
    <div
      className="bg-overlay z-overlay pointer-events-auto fixed inset-0 top-0"
      onClick={close}
      role="button"
      tabIndex={0}
    />
  );
}
