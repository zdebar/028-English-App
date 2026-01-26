import LightBulbIcon from '@/components/UI/icons/LightBulbIcon';
import { useHelpStore } from '@/features/help/use-help-store';

type HelpButtonProps = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @param style Inline styles for the button.
 */
export default function HelpButton({ className = '', style }: HelpButtonProps) {
  const { openHelp } = useHelpStore();

  return (
    <button
      type="button"
      className={`absolute z-10 flex h-10 w-10 items-center justify-center ${className}`}
      style={style}
      onClick={openHelp}
    >
      <LightBulbIcon />
    </button>
  );
}
