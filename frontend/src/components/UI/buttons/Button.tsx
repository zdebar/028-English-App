interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component for rendering a styled button element.
 *
 * @param className Additional CSS classes for custom styling.
 * @param children Content to be displayed inside the button.
 * @param props Standard button attributes.
 */
export default function Button({ className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`button-rectangular button-color ${className}`} {...props}>
      {children}
    </button>
  );
}
