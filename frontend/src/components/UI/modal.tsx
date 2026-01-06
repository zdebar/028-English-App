import Button from "./buttons/Button";
import OverlayMask from "@/components/UI/OverlayMask";

/**
 * Modal component for confirmation dialogs.
 *
 * @param showModal Determines if the modal is visible.
 * @param onConfirm Function called when the "Yes" button is clicked.
 * @param onClose Function called when the "No" button is clicked or when clicking outside the modal.
 * @param title The modal's title.
 * @param description The message or description displayed in the modal.
 * @returns JSX element for the modal, or null if not open.
 */
export function Modal({
  showModal,
  onConfirm,
  onClose,
  title,
  description,
}: {
  showModal: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  description: string;
}) {
  if (!showModal) {
    return null;
  }

  return (
    <>
      <OverlayMask onClose={onClose} />
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
    </>
  );
}
