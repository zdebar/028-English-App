import CloseIcon from '@/components/UI/icons/CloseIcon';
import { KEYBOARD_LISTENERS } from '@/config/keyboard-listeners.config';
import { useKey } from '@/hooks/use-key';
import { TEXTS } from '@/locales/cs';
import type { ButtonHTMLAttributes, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledButton from './StyledButton';

type CloseButtonProps = Readonly<{
  onClick?: () => void;
  navigateTo?: string;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

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
  ...rest
}: CloseButtonProps): JSX.Element {
  const navigate = useNavigate();
  const handleClose = () => {
    if (onClick) {
      onClick();
    } else if (navigateTo) {
      navigate(navigateTo);
    } else if (window.history.length > 1) {
      navigate(-1);
    }
  };
  useKey({
    onKeyPress: () => handleClose(),
    keys: KEYBOARD_LISTENERS.Exit,
    disabledOnOverlayOpen: true,
  });

  return (
    <StyledButton
      type="button"
      className={`w-button h-button shrink-0 grow-0 ${rest.className}`}
      onClick={handleClose}
      title={TEXTS.close + ' ' + KEYBOARD_LISTENERS.Exit.map((key) => '(' + key + ')').join(' ')}
      {...rest}
    >
      <CloseIcon />
    </StyledButton>
  );
}
