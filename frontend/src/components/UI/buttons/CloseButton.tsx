import { useKey } from '@/features/key-listener/use-key';
import CloseIcon from '@/components/UI/icons/CloseIcon';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import type { ButtonHTMLAttributes, JSX } from 'react';
import ButtonRectangular from './ButtonRectangular';

interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
  className?: string;
}

/**
 * Button component for closing dialogs or modals.
 *
 * @param onClick Function to call when button is clicked.
 * @param className Additional CSS classes for custom styling.
 * @returns The rendered button element.
 */
export default function CloseButton({
  onClick,
  className = '',
  ...rest
}: CloseButtonProps): JSX.Element {
  useKey({ onKeyPress: onClick, keys: KEYBOARD_LISTENERS.Exit, disabledOnOverlayOpen: true });

  return (
    <ButtonRectangular
      type="button"
      className={`w-button grow-0 ${className}`}
      onClick={onClick}
      {...rest}
    >
      <CloseIcon />
    </ButtonRectangular>
  );
}
