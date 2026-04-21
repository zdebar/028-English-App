import { useKey } from '@/features/key-listener/use-key';
import CloseIcon from '@/components/UI/icons/CloseIcon';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import type { ButtonHTMLAttributes, JSX } from 'react';
import BaseButton from './BaseButton';
import { TEXTS } from '@/locales/cs';

type CloseButtonProps = Readonly<{
  onClick: () => void;
  className?: string;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Button component for closing dialogs or modals.
 *
 * @param onClick Function to call when button is clicked.
 * @param className Additional CSS classes for custom styling.
 */
export default function CloseButton({
  onClick,
  className = '',
  ...rest
}: CloseButtonProps): JSX.Element {
  useKey({ onKeyPress: onClick, keys: KEYBOARD_LISTENERS.Exit, disabledOnOverlayOpen: true });

  return (
    <BaseButton
      type="button"
      className={['w-button h-button shrink-0 grow-0', className].filter(Boolean).join(' ')}
      onClick={onClick}
      title={TEXTS.close + ' ' + KEYBOARD_LISTENERS.Exit.map((key) => '(' + key + ')').join(' ')}
      {...rest}
    >
      <CloseIcon />
    </BaseButton>
  );
}
