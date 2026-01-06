import LightBulbIcon from "@/components/UI/icons/LightBulbIcon";
import { useOverlayStore } from "@/hooks/use-overlay-store";

/**
 * Help button component that opens the help overlay.
 *
 * @param className Additional CSS classes for custom styling.
 * @param style Inline styles for the button.
 * @returns A styled button with a light bulb icon that triggers the help overlay.
 */
export default function HelpButton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { open } = useOverlayStore();
  return (
    <button
      type="button"
      className={`z-10 p-1 ${className}`}
      style={style}
      onClick={open}
    >
      <LightBulbIcon />
    </button>
  );
}
