import QuestionMarkIcon from '@/components/UI/icons/QuestionMarkIcon';
import { useHelpStore } from './use-help-store';
import type { JSX } from 'react';

type HelpButtonProps = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @param style Inline styles for the button.
 * @return {JSX.Element} The rendered help button element.
 */
export default function HelpButton({ className = '', style }: HelpButtonProps): JSX.Element {
  const openHelp = useHelpStore((state) => state.openHelp);

  return (
    <button type="button" className={`absolute p-2 ${className}`} style={style} onClick={openHelp}>
      <QuestionMarkIcon />
    </button>
  );
}
