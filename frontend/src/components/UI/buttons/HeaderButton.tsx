import type { ReactNode, JSX } from 'react';
import { Link, useMatch } from 'react-router-dom';

type HeaderButtonProps = Readonly<{
  children: ReactNode;
  to: string;
  title?: string;
  disabled?: boolean;
  className?: string;
}>;

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
  title,
  disabled = false,
  className = '',
}: HeaderButtonProps): JSX.Element {
  const isSelected = useMatch({ path: to, end: true });

  if (disabled)
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        tabIndex={-1}
        className={`size-button text-disabled-light dark:text-disabled-dark flex cursor-default items-center justify-center rounded-full hover:bg-inherit ${className}`}
      >
        {children}
      </button>
    );

  return (
    <Link
      to={to}
      title={title}
      className={`size-button hover:text-light hover:bg-button-hover flex items-center justify-center rounded-full ${
        isSelected ? 'text-light bg-button-hover' : ''
      } ${className}`}
    >
      {children}
    </Link>
  );
}
