import { type JSX } from 'react';

type SigninButtonProps = Readonly<{
  isSubmitting: boolean;
  onClick: () => void;
  title: string;
  label: string;
  loadingLabel: string;
  className?: string;
}>;

export default function SigninButton({
  isSubmitting,
  onClick,
  title,
  label,
  loadingLabel,
  className,
}: SigninButtonProps): JSX.Element {
  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="font-body h-button bg-signin-button hover:bg-signin-button-hover focus-visible:bg-signin-button-hover w-full text-base font-medium text-black"
        title={title}
        disabled={isSubmitting}
      >
        {isSubmitting ? loadingLabel : label}
      </button>
    </div>
  );
}
