import { useKey } from '@/hooks/use-key';
import { useOverlayStore } from './use-overlay-store';
import { KEYBOARD_KEYS } from '@/config/keyboard-keys.config';

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked or when the Escape key is pressed.
 */
export default function OverlayMask() {
  const close = useOverlayStore((state) => state.closeOverlay);
  useKey({ onKeyPress: close, keys: KEYBOARD_KEYS.Exit });

  return (
    <div
      className="bg-overlay z-overlay pointer-events-auto fixed inset-0 top-0"
      onClick={close}
      role="button"
      tabIndex={0}
    />
  );
}
