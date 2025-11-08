import ButtonRectangular from "./button-rectangular";

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

  return (
    <div
      role="status"
      aria-live="polite"
      className=" fixed inset-0 bg-overlay z-1000 flex justify-center items-center"
    >
      <div className="bg-background-light dark:bg-background-dark card-width z-1001 flex flex-col justify-between min-h-40">
        <div className="flex flex-col text-center items-center p-4 gap-2 grow">
          <p className="font-bold">{title}</p>
          <p>{description}</p>
        </div>
        <div className="flex gap-1">
          <ButtonRectangular onClick={onClose}>Ne</ButtonRectangular>
          <ButtonRectangular onClick={onConfirm}>Ano</ButtonRectangular>
        </div>
      </div>
    </div>
  );
}
