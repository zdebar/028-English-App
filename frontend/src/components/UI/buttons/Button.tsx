interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

export default function Button({
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`shape-button-rectangular color-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
