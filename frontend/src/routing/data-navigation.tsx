import StyledButton from '@/components/UI/buttons/StyledButton';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, useNavigate, type LinkProps, type NavigateOptions } from 'react-router-dom';

type NavigationButtonProps = Readonly<{
  to: string;
  navigateOptions?: NavigateOptions;
  children: ReactNode;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function NavigationButton({
  to,
  navigateOptions,
  children,
  onClick,
  ...rest
}: NavigationButtonProps) {
  const navigate = useNavigate();

  return (
    <StyledButton
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        navigate(to, navigateOptions);
      }}
    >
      {children}
    </StyledButton>
  );
}

export function NavigationLink({ to, ...rest }: LinkProps) {
  return <Link to={to} {...rest} />;
}
