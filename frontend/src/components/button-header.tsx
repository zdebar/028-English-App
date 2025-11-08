import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  const isSelected = location.pathname === to;

  return (
    <Link
      to={disabled ? "#" : to}
      onClick={(e) => disabled && e.preventDefault()}
      className={`button-header flex items-center justify-center ${
        isSelected && "color-selected"
      } ${disabled && "color-disabled"} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
