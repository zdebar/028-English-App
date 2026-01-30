import { useKey } from '@/hooks/use-key';
import { useOverlayStore } from './use-overlay-store';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import type { JSX } from 'react';

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked or when the Escape key is pressed.
 * @return {JSX.Element} The rendered overlay mask element.
 */
export default function OverlayMask(): JSX.Element {
  const close = useOverlayStore((state) => state.closeOverlay);
  useKey({ onKeyPress: close, keys: KEYBOARD_LISTENERS.Exit });

  return (
    <div
      className="bg-overlay z-overlay pointer-events-auto fixed inset-0 top-0"
      onClick={close}
      role="button"
      tabIndex={0}
    />
  );
}
