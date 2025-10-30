import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useLocation } from "react-router-dom";

interface ButtonHeaderProps extends LinkProps {
  children: ReactNode;
  className?: string;
  to: string;
}

export default function ButtonHeader({
  children,
  className = "",
  to,
  ...props
}: ButtonHeaderProps) {
  const location = useLocation();
  const isSelected = location.pathname === to;

  return (
    <Link
      to={to}
      className={`button-header flex items-center justify-center ${
        isSelected && "bg-white text-light"
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
