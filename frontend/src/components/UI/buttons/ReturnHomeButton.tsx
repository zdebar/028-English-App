import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { ButtonHTMLAttributes, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledButton from './StyledButton';

/**
 * Button that navigates back to the home page.
 */
export default function ReturnHomeButton(
  props: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>,
): JSX.Element {
  const navigate = useNavigate();
  const { className, onClick, ...rest } = props;

  return (
    <StyledButton
      {...rest}
      className={`h-button mt-2 w-full ${className ?? ''}`.trim()}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          navigate(ROUTES.home);
        }
      }}
    >
      {props.children ?? TEXTS.tooltipHome}
    </StyledButton>
  );
}
