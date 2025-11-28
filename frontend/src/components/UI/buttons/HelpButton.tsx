import LightBulbIcon from "@/components/UI/icons/LightBulbIcon";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function HelpButton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { open } = useOverlayStore();
  return (
    <div
      className={`help-icon z-10 p-1 ${className}`}
      style={style}
      onClick={open}
    >
      <LightBulbIcon />
    </div>
  );
}
