import type { JSX, ButtonHTMLAttributes } from 'react';
import { useMatch } from 'react-router-dom';
import { DataNavigationLink } from '@/routing/data-navigation';
import type { RouteDataDescriptor } from '@/routing/route-data-handoff';

type HeaderButtonProps = Readonly<{
  to: string;
  descriptor?: RouteDataDescriptor<unknown>;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Header button component for navigation in the app header.
 *
 * @param to Destination path for navigation.
 */
export default function HeaderButton({ to, descriptor, ...rest }: HeaderButtonProps): JSX.Element {
  const isSelected = useMatch({ path: to ?? '', end: true });

  const sharedClasses = `${rest.className ?? ''} size-button flex items-center justify-center rounded-full`;

  if (rest.disabled)
    return (
      <button
        type="button"
      disabled
      aria-disabled="true"
      tabIndex={-1}
      className={`${sharedClasses} cursor-default text-disabled-light dark:text-disabled-dark hover:bg-inherit`}
      >
        {rest.children}
      </button>
    );

  return (
    <DataNavigationLink
      to={to}
      descriptor={descriptor}
      title={rest.title ?? ''}
      className={`${sharedClasses} hover:bg-button-hover hover:text-light focus-visible:outline-none focus-visible:bg-button-hover focus-visible:text-light ${
        isSelected ? 'text-light bg-button-hover' : ''
      }`}
    >
      {rest.children}
    </DataNavigationLink>
  );
}
