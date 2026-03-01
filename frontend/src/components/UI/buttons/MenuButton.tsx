import BaseButton from './BaseButton';

interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  className?: string;
}

/**
 * A menu button component that renders a button with bold text aligned to the left.
 * @component
 * @param text - The text content to display in the button
 * @param className - Optional CSS class names to apply to the button
 */
export function MenuButton({ text, className, ...rest }: MenuButtonProps) {
  return (
    <BaseButton {...rest} className={`h-button ${className}`}>
      <p className="w-40 text-left font-bold">{text}</p>
    </BaseButton>
  );
}
