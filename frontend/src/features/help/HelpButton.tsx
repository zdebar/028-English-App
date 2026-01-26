import LightBulbIcon from '@/components/UI/icons/LightBulbIcon';
import { useHelpStore } from './use-help-store';

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
  const openHelp = useHelpStore((state) => state.openHelp);

  return (
    <button
      type="button"
      className={`h-icon w-icon flex items-center justify-center ${className}`}
      style={style}
      onClick={openHelp}
    >
      <LightBulbIcon />
    </button>
  );
}
