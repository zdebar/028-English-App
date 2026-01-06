/**
 * Overlay mask component covering the entire screen.
 */
export default function OverlayMask({ onClose }: { onClose?: () => void }) {
  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="color-overlay shape-overlay" onClick={handleOverlayClick} />
  );
}
