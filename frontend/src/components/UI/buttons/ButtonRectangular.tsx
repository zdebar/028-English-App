interface ButtonRectangularProps {
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param className Additional CSS classes for custom styling.
 * @param onClick Function to call when button is clicked.
 * @param children Content to be displayed inside the button.
 */
export default function ButtonRectangular({
  className = '',
  disabled = false,
  onClick,
  children,
}: ButtonRectangularProps) {
  return (
    <button
      className={`button-rectangular button-color ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
