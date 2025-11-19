export default function Overlay({onClose}: { onClose: () => void }) {

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className=" fixed inset-0 bg-overlay z-1000 flex justify-center items-center"
      onClick={handleOverlayClick}
    >
    </div>
  );
}