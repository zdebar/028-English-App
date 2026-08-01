import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import { useKey } from '@/hooks/use-key';
import { ARIA_TEXTS } from '@/locales/cs';
import { useCallback, type JSX } from 'react';
import { useOverlayStore } from './use-overlay-store';

export default function OverlayMask(): JSX.Element | null {
  const dismissOverlay = useOverlayStore((state) => state.dismissOverlay);
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);
  const handleClose = useCallback(() => dismissOverlay(), [dismissOverlay]);

  useKey({ onKeyPress: handleClose, keys: KEYBOARD_LISTENERS.Exit });

  if (!isOverlayOpen) {
    return null;
  }

  return (
    <button
      className="bg-overlay z-overlay pointer-events-auto fixed inset-0 top-0 m-0 border-none p-0"
      onClick={handleClose}
      aria-label={ARIA_TEXTS.closeOverlay}
    />
  );
}
