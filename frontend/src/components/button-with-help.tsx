import GuideHint from "./guide-hint";
import Button from "./button";

export default function ButtonWithHelp({
  onClick,
  disabled = false,
  helpVisibility = false,
  helpText,
  style,
  icon,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  helpVisibility?: boolean;
  helpText: string;
  style?: React.CSSProperties;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`relative ${className}`}
      aria-label={helpText}
    >
      <GuideHint visibility={helpVisibility} text={helpText} style={style} />
      {icon}
    </Button>
  );
}
