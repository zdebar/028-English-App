import { useKey } from '@/hooks/use-key';
import CloseIcon from '@/components/UI/icons/CloseIcon';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';

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
  useKey({ onKeyPress: onClick, keys: KEYBOARD_LISTENERS.Exit, disabledOnOverlayOpen: true });

  return (
    <button
      type="button"
      className={`button-rectangular button-color w-button grow-0 ${className}`}
      onClick={onClick}
    >
      <CloseIcon />
    </button>
  );
}
