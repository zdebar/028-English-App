import { useOverlayStore } from './use-overlay-store';
import OverlayMask from './OverlayMask';

export default function OverlayContainer() {
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);

  if (!isOverlayOpen) return null;

  return <OverlayMask />;
}
