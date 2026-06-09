import StyledButton from '@/components/UI/buttons/StyledButton';
import HelpText from '@/features/help/HelpText';
import type { ReactNode, JSX } from 'react';

type PracticeButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  Readonly<{
    icon: ReactNode;
    label: string;
    helpSide: 'left' | 'right';
    children?: ReactNode;
  }>;

export default function PracticeButton({
  icon,
  label,
  helpSide,
  children,
  ...rest
}: PracticeButtonBaseProps): JSX.Element {
  return (
    <>
      <StyledButton
        {...rest}
        className="h-controls relative"
        title={rest.disabled ? undefined : label}
      >
        {icon}
        {children}
      </StyledButton>
      <HelpText className={`-top-4.5 ${helpSide === 'left' ? 'left-4' : 'right-4'}`}>
        {label}
      </HelpText>
    </>
  );
}
