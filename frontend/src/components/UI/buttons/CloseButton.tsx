import { useKey } from '@/features/key-listener/use-key';
import CloseIcon from '@/components/UI/icons/CloseIcon';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import type { ButtonHTMLAttributes, JSX } from 'react';
import BaseButton from './BaseButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes.config';

type CloseButtonProps = Readonly<{
  onClick?: () => void;
  className?: string;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Button component for closing dialogs.
 * Returns to the onClick if provided, or navigates back if possible, or to the home page.
 * Also supports keyboard shortcuts for accessibility.
 *
 * @param onClick Optional callback function to execute when the button is clicked.
 * @param className Additional CSS classes for custom styling.
 */
export default function CloseButton({
  onClick,
  className = '',
  ...rest
}: CloseButtonProps): JSX.Element {
  const navigate = useNavigate();
  const handleClose = () => {
    if (onClick) {
      onClick();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.home);
    }
  };
  useKey({
    onKeyPress: () => handleClose(),
    keys: KEYBOARD_LISTENERS.Exit,
    disabledOnOverlayOpen: true,
  });

  return (
    <BaseButton
      type="button"
      className={['w-button h-button shrink-0 grow-0', className].filter(Boolean).join(' ')}
      onClick={handleClose}
      title={TEXTS.close + ' ' + KEYBOARD_LISTENERS.Exit.map((key) => '(' + key + ')').join(' ')}
      {...rest}
    >
      <CloseIcon />
    </BaseButton>
  );
}
