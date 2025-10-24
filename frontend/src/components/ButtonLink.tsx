import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

interface ButtonLinkProps extends Omit<LinkProps, "to"> {
  children: ReactNode;
  disabled?: boolean;
  buttonType?: string;
  buttonColor?: string;
  className?: string;
  to: string;
}

export default function ButtonLink({
  children,
  disabled = false,
  buttonType = "button-rectangular",
  buttonColor = "color-button",
  className = "",
  to,
  ...props
}: ButtonLinkProps) {
  const buttonClass = `${buttonType} centered  ${className} `;

  if (disabled) {
    return (
      <button
        className={`${buttonClass} color-disabled pointer-events-none`}
        disabled
      >
        {children}
      </button>
    );
  }

  return (
    <Link to={to} className={`${buttonClass} ${buttonColor}`} {...props}>
      {children}
    </Link>
  );
}
