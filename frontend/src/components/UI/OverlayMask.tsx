/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Optional function called when the overlay is clicked.
 * @returns A full-screen overlay mask element.
 */
export default function OverlayMask({ onClose }: { onClose?: () => void }) {
  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return <div className="color-overlay shape-overlay" onClick={handleOverlayClick} />;
}
