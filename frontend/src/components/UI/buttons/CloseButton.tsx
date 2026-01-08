import CloseIcon from '@/components/UI/icons/CloseIcon';

/**
 * Button component for closing dialogs or modals.
 */
export default function CloseButton({
  onClick,
  className = '',
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={`flex items-center justify-center ${className}`} onClick={onClick}>
      <CloseIcon />
    </button>
  );
}
