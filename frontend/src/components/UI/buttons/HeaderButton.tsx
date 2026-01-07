import type { ReactNode } from 'react';
import { Link, useMatch, type LinkProps } from 'react-router-dom';

interface HeaderButtonProps extends LinkProps {
  to: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * Header button component for navigation in the app header.
 *
 * @param to The navigation target path.
 * @param children Content to be displayed inside the button.
 * @param disabled Disables the button if true.
 * @param className Additional CSS classes for custom styling.
 * @param props Other LinkProps for the underlying Link component.
 * @returns A styled navigation button or a disabled span if disabled.
 */
export default function HeaderButton({
  to,
  children,
  disabled = false,
  className = '',
  ...props
}: HeaderButtonProps) {
  const isSelected = useMatch(to);

  return disabled ? (
    <span
      className={`shape-button-header color-button-header-disabled flex items-center justify-center ${className}`}
      aria-disabled="true"
      {...props}
    >
      {children}
    </span>
  ) : (
    <Link
      to={to}
      className={`shape-button-header color-button-header flex items-center justify-center ${
        isSelected && 'color-selected'
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
