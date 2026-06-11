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

  const sharedClasses = `${rest.className ?? ''} size-button flex items-center justify-center rounded-full  `;

  if (rest.disabled)
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        tabIndex={-1}
        className={` ${sharedClasses} text-disabled-light dark:text-disabled-dark cursor-default hover:bg-inherit`}
      >
        {rest.children}
      </button>
    );

  return (
    <Link
      to={to}
      title={rest.title ?? ''}
      className={`${sharedClasses} hover:text-light hover:bg-button-hover ${
        isSelected ? 'text-light bg-button-hover' : ''
      } `}
    >
      {rest.children}
    </Link>
  );
}
