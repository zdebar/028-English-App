import type { JSX, ReactNode } from 'react';
import { useMatch } from 'react-router-dom';
import { NavigationLink } from '@/routing/data-navigation';

type HeaderButtonProps = Readonly<{
  to: string;
  title: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}>;

/**
 * Header button component for navigation in the app header.
 *
 * @param to Destination path for navigation.
 */
export default function HeaderButton({
  to,
  title,
  disabled = false,
  className = '',
  children,
}: HeaderButtonProps): JSX.Element {
  const isSelected = useMatch({ path: to, end: true });

  const sharedClasses = `${className} size-button flex items-center justify-center rounded-full grow-0 shrink-0`;

  if (disabled)
    return (
      <button
        type="button"
        disabled
        aria-label={title}
        title={title}
        className={`${sharedClasses} text-disabled-light dark:text-disabled-dark cursor-default hover:bg-inherit`}
      >
        {children}
      </button>
    );

  return (
    <NavigationLink
      to={to}
      title={title}
      aria-label={title}
      className={`${sharedClasses} hover:bg-button-hover hover:text-light focus-visible:outline-none focus-visible:bg-button-hover focus-visible:text-light ${
        isSelected ? 'text-light bg-button-hover' : ''
      }`}
    >
      {children}
    </NavigationLink>
  );
}
