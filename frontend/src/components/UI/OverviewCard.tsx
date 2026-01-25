import CloseButton from '@/components/UI/buttons/CloseButton';
import Hint from '@/components/UI/Hint';
import { TEXTS } from '@/config/texts';
import { useHelpStore } from '@/features/help/use-help-store';
import ButtonModal from './buttons/ButtonLoadingModal';

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
  hintDescription = TEXTS.eraseProgress,
  error = null,
  className = '',
  handleReset,
  onClose,
  children,
}: OverviewCardProps) {
  const { isOpen } = useHelpStore();

  return (
    <div className={`card-height card-width flex flex-col justify-start gap-1 ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <ButtonModal
          buttonTitle={titleText}
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
        <Hint visible={isOpen} className="top-0 left-3.5">
          {hintDescription}
        </Hint>
        <CloseButton onClick={onClose} />
      </div>
      <div className="w-full grow p-4">{error ? <p>{error}</p> : children}</div>
    </div>
  );
}
