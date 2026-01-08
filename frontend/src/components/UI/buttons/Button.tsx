interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Button component for rendering a styled button element.
 */
export default function Button({ className = '', children, ...props }: ButtonProps) {
  return (
    <button className={`shape-button-rectangular color-button ${className}`} {...props}>
      {children}
    </button>
  );
}
