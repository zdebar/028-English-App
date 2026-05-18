import StyledButton from '@/components/UI/buttons/StyledButton';
import HelpText from '@/features/help/HelpText';
import type { ReactNode, JSX } from 'react';

type PracticeButtonBaseProps = Readonly<{
  icon: ReactNode;
  label: string;
  helpSide: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
  children?: ReactNode;
}>;

export default function PracticeButton({
  icon,
  label,
  helpSide,
  onClick,
  disabled,
  children,
}: PracticeButtonBaseProps): JSX.Element {
  return (
    <>
      <StyledButton
        onClick={onClick}
        disabled={disabled}
        className="h-button relative"
        title={disabled ? undefined : label}
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
