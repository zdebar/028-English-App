import type { ReactNode } from 'react';
import { Link, useMatch } from 'react-router-dom';

interface HeaderButtonProps {
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

 */
export default function HeaderButton({
  to,
  children,
  disabled = false,
  className = '',
}: HeaderButtonProps) {
  const isSelected = useMatch(to);

  if (disabled)
    return (
      <span
        className={`button-round flex cursor-default items-center justify-center text-gray-100 hover:bg-inherit dark:text-gray-500 ${className}`}
      >
        {children}
      </span>
    );

  return (
    <Link
      to={to}
      className={`button-round hover:text-light flex items-center justify-center hover:bg-white ${
        isSelected && 'text-light bg-white'
      } ${className}`}
    >
      {children}
    </Link>
  );
}
