import StyledButton from '@/components/UI/buttons/StyledButton';
import HelpText from '@/features/help/HelpText';
import type { ReactNode, JSX } from 'react';

type PracticeButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Readonly<{
    icon: ReactNode;
    label: string;
    className?: string;
    children?: ReactNode;
  }>;

export default function PracticeButton({
  icon,
  label,
  className = '',
  children,
  ...rest
}: PracticeButtonBaseProps): JSX.Element {
  return (
    <div className="relative w-full">
      <StyledButton
        {...rest}
        className="h-controls w-full"
        title={rest.disabled ? undefined : label}
      >
        {icon}
        {children}
      </StyledButton>
      <HelpText className={className}>{label}</HelpText>
    </div>
  );
}
