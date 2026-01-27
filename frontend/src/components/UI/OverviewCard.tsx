import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/config/texts';
import ButtonModal from '../../features/modal/ButtonModal';
import HelpText from '@/features/help/HelpText';

interface OverviewCardProps {
  titleText?: string;
  modalText?: string;
  modalDescription?: string;
  hintDescription?: string;
  error?: string | null;
  className?: string;
  handleReset?: () => Promise<void>;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * OverviewCard component for displaying a card with a title, actions, and content.
 * @param titleText Title text for the card.
 * @param modalText Title for the confirmation modal.
 * @param modalDescription Description for the confirmation modal.
 * @param hintDescription Description for the hint tooltip.
 * @param error Error message to display.
 * @param className Additional CSS classes for custom styling.
 * @param handleReset Function to call to reset progress.
 * @param onClose Function to call when closing the card.
 * @param children Content to be displayed inside the card.
 */
export default function OverviewCard({
  titleText = TEXTS.notAvailable,
  modalText = TEXTS.eraseProgress,
  modalDescription = TEXTS.eraseDescription,
  // hintDescription = TEXTS.eraseProgress,
  error = null,
  className = '',
  handleReset,
  onClose,
  children,
}: OverviewCardProps) {
  return (
    <div className={`card-width flex flex-col justify-start gap-1 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <ButtonModal
          label={titleText}
          modalTitle={modalText}
          modalDescription={modalDescription}
          onConfirm={async () => {
            if (handleReset) {
              await handleReset();
            }
            onClose();
          }}
          disabled={!handleReset}
          className="flex items-center justify-start pl-4"
        />
        <CloseButton onClick={onClose} />
      </div>
      <HelpText className="left-3.5 pt-7">{TEXTS.eraseProgress}</HelpText>
      <div className="w-full grow p-4">{error ? <p>{error}</p> : children}</div>
    </div>
  );
}
