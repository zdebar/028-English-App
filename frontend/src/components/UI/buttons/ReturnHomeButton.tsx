import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { ButtonHTMLAttributes, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledButton from './StyledButton';

/**
 * Button that navigates back to the home page.
 */
export default function ReturnHomeButton({
  className = '',
  onClick,
  children,
  ...rest
}: Readonly<ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  const navigate = useNavigate();

  return (
    <StyledButton
      {...rest}
      className={`h-controls mt-2 w-full grow-0 ${className}`.trim()}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        void navigate(ROUTES.home);
      }}
    >
      {children ?? TEXTS.tooltipHome}
    </StyledButton>
  );
}
