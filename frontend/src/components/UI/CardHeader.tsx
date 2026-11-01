import type { ReactNode, HTMLAttributes, JSX } from 'react';
import CloseButton from '@/components/UI/buttons/CloseButton';

type CardHeaderProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClose'> & {
    children: ReactNode;
    onClose?: () => void;
  }
>;

/**
 * CardHeader component for displaying a header with a close button.
 * @param children - Content to display in the header, typically a title or heading.
 * @param onClose - Optional close callback. Without it, the close button uses its default history-back behavior.
 * @param className - Additional CSS classes for custom styling of the header container.
 * @returns A JSX element representing the card header.
 */
export function CardHeader({
  children,
  onClose,
  className = '',
  ...props
}: CardHeaderProps): JSX.Element {
  return (
    <div {...props} className={`flex items-center justify-between gap-1 ${className}`}>
      {children}
      <CloseButton onClick={onClose} />
    </div>
  );
}
