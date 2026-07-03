import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react';

type SecondaryControlButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ariaLabel?: string;
    children: ReactNode;
  }
>;

export default function SecondaryControlButton({
  ariaLabel,
  children,
  className = '',
  title,
  type = 'button',
  ...rest
}: SecondaryControlButtonProps): JSX.Element {
  const buttonClassName = [
    'secondary-control secondary-control-button relative flex cursor-pointer items-center justify-center rounded-full disabled:cursor-default disabled:text-disabled-light dark:disabled:text-disabled-dark',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      className={buttonClassName}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      {children}
    </button>
  );
}
