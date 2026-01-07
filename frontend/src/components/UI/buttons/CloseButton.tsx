import CloseIcon from '@/components/UI/icons/CloseIcon';

/**
 * Button component for closing dialogs or modals.
 *
 * @param onClick Function called when the button is clicked.
 * @param className Additional CSS classes for custom styling.
 * @returns A styled button with a close icon.
 */
export default function CloseButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={`flex items-center justify-center ${className}`} onClick={onClick}>
      <CloseIcon />
    </button>
  );
}
