import CloseButton from '@/components/UI/buttons/CloseButton';
import Hint from '@/components/UI/Hint';
import { TEXTS } from '@/config/texts';
import { useOverlayStore } from '@/features/overlay/use-overlay-store';
import ButtonAsyncModal from './buttons/ButtonAsyncModal';

interface OverviewCardProps {
  titleText?: string;
  error?: string | null;
  className?: string;
  handleReset?: () => Promise<void>;
  onClose: () => void;
  children?: React.ReactNode;
}

/**
 * OverviewCard component for displaying a card with a title, actions, and content.
 * @param titleText Title text for the card.
 * @param error Error message to display.
 * @param className Additional CSS classes for custom styling.
 * @param handleReset Function to call to reset progress.
 * @param onClose Function to call when closing the card.
 * @param children Content to be displayed inside the card.
 */
export default function OverviewCard({
  titleText = TEXTS.notAvailable,
  error = null,
  className = '',
  handleReset,
  onClose,
  children,
}: OverviewCardProps) {
  const { isOpen } = useOverlayStore();

  return (
    <div className={`card-height card-width flex flex-col justify-start gap-1 ${className}`}>
      <div className="h-button flex items-center justify-between gap-1">
        <ButtonAsyncModal
          buttonTitle={titleText}
          modalTitle={TEXTS.eraseProgress}
          modalDescription={TEXTS.eraseDescription}
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
          {TEXTS.eraseProgress}
        </Hint>
        <CloseButton className="w-button grow-0" onClick={onClose} />
      </div>
      <div className="w-full grow p-4">{error ? <p>{error}</p> : children}</div>
    </div>
  );
}
