import type { ReactNode } from 'react';
import { Link, useMatch } from 'react-router-dom';
import type { JSX } from 'react';

interface HeaderButtonProps {
  children: ReactNode;
  to: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Header button component for navigation in the app header.
 *
 * @param children Content to be displayed inside the button.
 * @param to Destination path for navigation.
 * @param disabled Whether the button is disabled.
 * @param className Additional CSS classes for custom styling.
 * @returns The rendered button element.
 */
export default function HeaderButton({
  children,
  to,
  disabled = false,
  className = '',
}: HeaderButtonProps): JSX.Element {
  const isSelected = useMatch({ path: to, end: true });

  if (disabled)
    return (
      <span
        role="button"
        aria-disabled="true"
        className={`button-round text-disabled-light dark:text-disabled-dark cursor-default hover:bg-inherit ${className}`}
      >
        {children}
      </span>
    );

  return (
    <Link
      to={to}
      className={`button-round hover:text-light hover:bg-button-hover ${
        isSelected ? 'text-light bg-button-hover' : ''
      } ${className}`}
    >
      {children}
    </Link>
  );
}
