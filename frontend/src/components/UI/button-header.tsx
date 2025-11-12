import type { ReactNode } from "react";
import { Link, useMatch, type LinkProps } from "react-router-dom";

/**
 * Props for the ButtonHeader component.
 * @property {ReactNode} children - The content of the button.
 * @property {boolean} [disabled] - Whether the button is disabled.
 * @property {string} [className] - Additional CSS classes for styling.
 */
interface ButtonHeaderProps extends LinkProps {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  to: string;
}

/**
 * A header button component - button-header.
 */
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
      className={`button-header flex items-center justify-center color-header-disabled ${className}`}
      aria-disabled="true"
      {...props}
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
