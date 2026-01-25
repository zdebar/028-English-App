import { useKey } from '@/hooks/use-key';
import ButtonRectangular from './ButtonRectangular';
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
  useKey(onClick, ['Escape']);

  return (
    <ButtonRectangular className={`w-button grow-0 ${className}`} onClick={onClick}>
      <CloseIcon />
    </ButtonRectangular>
  );
}
