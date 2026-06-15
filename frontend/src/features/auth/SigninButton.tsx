import { type JSX } from 'react';

type SigninButtonProps = Readonly<{
  onClick: () => void;
  title: string;
  label: string;
  signinLabel?: string;
  isSignin?: boolean;
  disabled?: boolean;
  className?: string;
}>;

export default function SigninButton({
  onClick,
  title,
  label,
  signinLabel,
  className,
  disabled = false,
  isSignin = false,
}: SigninButtonProps): JSX.Element | null {
  const disabledClass =
    disabled || isSignin
      ? 'cursor-not-allowed bg-signin-disabled'
      : 'hover:bg-signin-button-hover focus-visible:bg-signin-button-hover bg-signin-button';

  return (
    <div className={`relative flex w-full flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`font-body h-button w-full text-base font-medium text-auth-button-text ${disabledClass}`}
        title={title}
        disabled={disabled || isSignin}
      >
        {isSignin ? signinLabel : label}
      </button>
    </div>
  );
}
