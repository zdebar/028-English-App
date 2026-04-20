import { useKey } from '@/features/key-listener/use-key';
import { useOverlayStore } from './use-overlay-store';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import { useCallback, type JSX } from 'react';

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked or when the Escape key is pressed.
 * @return {JSX.Element | null} The rendered overlay mask element or null if the overlay is not open.
 */
export default function OverlayMask(): JSX.Element | null {
  const closeOverlay = useOverlayStore((state) => state.closeOverlay);
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);
  const handleClose = useCallback(() => {
    closeOverlay();
  }, [closeOverlay]);

  useKey({ onKeyPress: handleClose, keys: KEYBOARD_LISTENERS.Exit });

  if (!isOverlayOpen) {
    return null;
  }

  return (
    <button
      className="bg-overlay z-overlay pointer-events-auto fixed inset-0 top-0"
      onClick={handleClose}
      aria-label="Close overlay"
      style={{ border: 'none', background: 'none', padding: 0, margin: 0 }}
    />
  );
}
