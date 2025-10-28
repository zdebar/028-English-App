export default function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const handleOverlayClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClose();
  };

  return (
    <div
      className="color-overlay fixed inset-0 z-5"
      role="dialog"
      style={{
        pointerEvents: 'all',
      }}
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div
        className="mx-auto max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
