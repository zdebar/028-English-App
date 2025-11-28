import CloseIcon from "@/components/UI/icons/CloseIcon";

export default function CloseButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`w-11 h-11 flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      <CloseIcon />
    </button>
  );
}
