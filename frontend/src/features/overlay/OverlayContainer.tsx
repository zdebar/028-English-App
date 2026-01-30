import { useOverlayStore } from './use-overlay-store';
import OverlayMask from './OverlayMask';
import type { JSX } from 'react';

/**
 * A React component that conditionally renders an overlay mask based on the overlay state.
 *
 * @returns {JSX.Element | null} The overlay mask if the overlay is open, otherwise null.
 */
export default function OverlayContainer(): JSX.Element | null {
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);

  if (!isOverlayOpen) return null;

  return <OverlayMask />;
}
