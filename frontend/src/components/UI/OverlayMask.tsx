type OverlayMaskProps = {
  onClose?: () => void;
};

/**
 * Overlay mask component covering the entire screen.
 */
export default function OverlayMask({ onClose }: OverlayMaskProps) {
  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return <div className="color-overlay shape-overlay" onClick={handleOverlayClick} />;
}
