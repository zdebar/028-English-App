import CloseIcon from '@/components/UI/icons/CloseIcon';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Button component for closing dialogs or modals.
 *
 * @param onClick Function to call when button is clicked.
 * @param className Additional CSS classes for custom styling.
 */
export default function CloseButton({ onClick, className = '' }: CloseButtonProps) {
  return (
    <button className={`flex items-center justify-center ${className}`} onClick={onClick}>
      <CloseIcon />
    </button>
  );
}
