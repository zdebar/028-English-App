import type { JSX, ButtonHTMLAttributes } from 'react';
import { Link, useMatch } from 'react-router-dom';

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

  if (rest.disabled)
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        tabIndex={-1}
        className={`size-button text-disabled-light dark:text-disabled-dark flex cursor-default items-center justify-center rounded-full hover:bg-inherit ${rest.className ?? ''}`}
      >
        {rest.children}
      </button>
    );

  return (
    <Link
      to={to}
      title={rest.title ?? ''}
      className={`size-button hover:text-light hover:bg-button-hover flex items-center justify-center rounded-full ${
        isSelected ? 'text-light bg-button-hover' : ''
      } ${rest.className ?? ''}`}
    >
      {rest.children}
    </Link>
  );
}
