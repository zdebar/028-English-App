import type { JSX, ButtonHTMLAttributes } from 'react';
import { useMatch } from 'react-router-dom';
import { NavigationLink } from '@/routing/data-navigation';

type HeaderButtonProps = Readonly<{
  to: string;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Header button component for navigation in the app header.
 *
 * @param to Destination path for navigation.
 */
export default function HeaderButton({ to, ...rest }: HeaderButtonProps): JSX.Element {
  const isSelected = useMatch({ path: to ?? '', end: true });

  const sharedClasses = `${rest.className ?? ''} size-button flex items-center justify-center rounded-full grow-0 shrink-0`;

  if (rest.disabled)
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        tabIndex={-1}
        className={`${sharedClasses} text-disabled-light dark:text-disabled-dark cursor-default hover:bg-inherit`}
      >
        {rest.children}
      </button>
    );

  return (
    <NavigationLink
      to={to}
      title={rest.title ?? ''}
      className={`${sharedClasses} hover:bg-button-hover hover:text-light focus-visible:outline-none focus-visible:bg-button-hover focus-visible:text-light ${
        isSelected ? 'text-light bg-button-hover' : ''
      }`}
    >
      {rest.children}
    </NavigationLink>
  );
}
