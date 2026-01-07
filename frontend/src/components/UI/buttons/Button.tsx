interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param className Additional CSS classes for custom styling.
 * @param children Content to be displayed inside the button.
 * @param props Other standard button attributes.
 * @returns A styled button element.
 */
export default function Button({ className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`shape-button-rectangular color-button ${className}`} {...props}>
      {children}
    </button>
  );
}
