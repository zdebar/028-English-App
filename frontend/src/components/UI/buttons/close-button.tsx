import CloseIcon from "@/assets/icons/close-icon";

export default function CloseButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <p
      className={`w-11 h-11  flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      <CloseIcon />
    </p>
  );
}
