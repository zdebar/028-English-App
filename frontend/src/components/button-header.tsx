import type { ReactNode } from "react";
import { Link, useMatch, type LinkProps } from "react-router-dom";

interface ButtonHeaderProps extends LinkProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  to: string;
}

export default function ButtonHeader({
  children,
  disabled = false,
  className = "",
  to,
  ...props
}: ButtonHeaderProps) {
  const isSelected = useMatch(to);

  return disabled ? (
    <span
      className={`button-header flex items-center justify-center color-disabled ${className}`}
      aria-disabled="true"
    >
      {children}
    </span>
  ) : (
    <Link
      to={to}
      className={`button-header flex items-center justify-center ${
        isSelected && "color-selected"
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
