import LightBulbIcon from '@/components/UI/icons/LightBulbIcon';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';

type HelpButtonProps = {
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @param style Inline styles for the button.
 * @returns A styled button with a light bulb icon that triggers the help overlay.
 */
export default function HelpButton({ className = '', style }: HelpButtonProps) {
  const { open } = useOverlayStore();
  return (
    <button
      type="button"
      className={`absolute top-7 z-10 flex h-10 w-10 items-center justify-center ${className}`}
      style={style}
      onClick={open}
    >
      <LightBulbIcon />
    </button>
  );
}
