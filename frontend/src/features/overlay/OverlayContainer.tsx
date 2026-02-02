import { useOverlayStore } from './use-overlay-store';
import OverlayMask from './OverlayMask';
import type { JSX } from 'react';

/**
 * A React component that conditionally renders an overlay mask based on the overlay state.
 *
 * Mask behavior:
 * - Covers the entire viewport when the overlay is open.
 * - Stops propagation of pointer events to underlying elements.
 * - Disables keyboard events for elements using `useKey` when their `disabledOnOverlayOpen` prop is true.
 *
 * @returns The overlay mask if the overlay is open, otherwise null.
 */
export default function OverlayContainer(): JSX.Element | null {
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);

  if (!isOverlayOpen) return null;

  return <OverlayMask />;
}
