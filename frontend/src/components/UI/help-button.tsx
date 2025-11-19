import { HelpIcon } from "./icons";
import { useOverlayStore } from "@/hooks/use-overlay-store";

export default function HelpButton({ className = "" }: { className?: string }) {
  const { open } = useOverlayStore();
  return (
    <div
      className={`help-icon z-10 p-1 ${className}`}
      style={{
        bottom: "5px",
        right: "5px",
      }}
      onClick={open}
    >
      <HelpIcon />
    </div>
  );
}
