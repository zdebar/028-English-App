import { useOverlayStore } from './use-overlay-store';
import OverlayMask from './OverlayMask';

/**
 * A React component that conditionally renders an overlay mask based on the overlay state.
 *
 * @returns {React.FC | null} The overlay mask if the overlay is open, otherwise null.
 */
export default function OverlayContainer(): React.ReactElement | null {
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);

  if (!isOverlayOpen) return null;

  return <OverlayMask />;
}
