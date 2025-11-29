import Button from "./buttons/Button";

export function Modal({
  isOpen,
  onConfirm,
  onClose,
  title,
  description,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  description: string;
}) {
  if (!isOpen) return null;

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
      <div className=" card-width z-1001 flex flex-col justify-between min-h-40">
        <div className="bg-background-light dark:bg-background-dark flex flex-col text-center items-center p-4 gap-2 grow">
          <p className="font-bold">{title}</p>
          <p>{description}</p>
        </div>
        <div className="flex gap-1">
          <Button onClick={onClose}>Ne</Button>
          <Button onClick={onConfirm}>Ano</Button>
        </div>
      </div>
    </div>
  );
}
