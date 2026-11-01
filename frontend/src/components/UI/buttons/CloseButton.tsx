import CloseIcon from '@/components/UI/icons/CloseIcon';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import { useKey } from '@/hooks/use-key';
import { TEXTS } from '@/locales/cs';
import type { ButtonHTMLAttributes, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledButton from './StyledButton';

type CloseButtonProps = Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
    onClick?: () => void;
    navigateTo?: string;
  }
>;

const DEFAULT_CLOSE_TITLE = [
  TEXTS.close,
  ...KEYBOARD_LISTENERS.Exit.map((key) => `(${key})`),
].join(' ');

/**
 * Button component for closing dialogs.
 * Returns to the onClick if provided, or navigates (-1) if possible.
 * Reacts to keyboard listeners for closing as defined in KEYBOARD_LISTENERS.Exit.
 *
 * @param onClick Optional callback function to execute when the button is clicked.
 * @param navigateTo Optional path to navigate to when the button is clicked. Only used if onClick is not provided.
 */
export default function CloseButton({
  onClick,
  navigateTo,
  className = '',
  title,
  'aria-label': ariaLabel,
  ...rest
}: CloseButtonProps): JSX.Element {
  const navigate = useNavigate();
  const isOverlayOpen = useOverlayStore((state) => state.isOverlayOpen);
  const handleClose = () => {
    if (onClick) {
      onClick();
    } else if (navigateTo) {
      void navigate(navigateTo);
    } else if (globalThis.history.length > 1) {
      void navigate(-1);
    }
  };
  useKey({
    onKeyPress: handleClose,
    keys: KEYBOARD_LISTENERS.Exit,
    enabled: !isOverlayOpen,
  });

  return (
    <StyledButton
      {...rest}
      type="button"
      className={`w-button h-button shrink-0 grow-0 ${className}`}
      onClick={handleClose}
      aria-label={ariaLabel ?? TEXTS.close}
      title={title ?? DEFAULT_CLOSE_TITLE}
    >
      <CloseIcon />
    </StyledButton>
  );
}
