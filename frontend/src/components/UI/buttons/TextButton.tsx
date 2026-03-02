interface TextButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A styled button component for toggling mastered state.
 *
 * @param onClick - Callback function triggered when the button is clicked
 * @param children - The content to display inside the button
 * @param className - Additional CSS classes to apply to the button
 * @returns A button element with absolute positioning and info color styling
 */
export default function TextButton({ onClick, children, className = '' }: TextButtonProps) {
  return (
    <button
      type="button"
      className={`color-info absolute -bottom-9 left-4 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
