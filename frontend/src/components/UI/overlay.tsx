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
    <div
      className="fixed inset-0 z-1000"
      onClick={handleOverlayClick}
      style={{
        pointerEvents: "auto",
        background: "rgba(0,0,0,0.5)",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        position: "fixed",
      }}
    />
  );
}
