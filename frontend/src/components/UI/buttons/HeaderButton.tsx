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
 * @param to Destination path for navigation.
 * @param children Content to be displayed inside the button.
 * @param disabled Whether the button is disabled.
 * @param className Additional CSS classes for custom styling.
 * @param props Standard link attributes.
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
      className={`button-header color-header-disabled flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </span>
  ) : (
    <Link
      to={to}
      className={`button-header color-header flex items-center justify-center ${
        isSelected ? 'color-selected' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
