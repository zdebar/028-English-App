import CloseButton from '@/components/UI/buttons/CloseButton';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import ButtonWithModal from '../../features/modal/ButtonWithModal';

interface OverviewCardProps {
  titleText?: string;
  modalText?: string;
  modalDescription?: string;
  helpText?: string;
  handleReset?: () => Promise<void>;
  onClose: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * OverviewCard component for displaying a card with a title, and content.
 * Title button triggers confirmation modal for handleReset function. If handleResest is not provided, the reset button is disabled.
 * Component doesn't handle errors. Errors should be handled in the parent component.
 *
 * @param titleText Title text for the card.
 * @param modalText Title for the confirmation modal.
 * @param modalDescription Description for the confirmation modal.
 * @param helpText Description for the help tooltip.
 * @param handleReset Function to call to reset progress.
 * @param onClose Function to call when closing the card.
 * @param className Additional CSS classes for custom styling.
 * @param children Content to be displayed inside the card.
 * @returns The rendered OverviewCard component.
 */
export default function OverviewCard({
  titleText = TEXTS.notAvailable,
  modalText = TEXTS.eraseProgress,
  modalDescription = TEXTS.eraseDescription,
  helpText = TEXTS.eraseProgress,
  handleReset,
  onClose,
  className = '',
  children,
}: OverviewCardProps): JSX.Element {
  return (
    <div className={`card-width flex flex-col justify-start gap-1 ${className}`}>
      {/* Top Bar */}
      <div className="relative flex items-center justify-between gap-1">
        {/* Title and Reset Button */}
        <ButtonWithModal
          buttonText={titleText}
          onConfirm={async () => {
            if (handleReset) {
              await handleReset();
            }
            onClose();
          }}
          disabled={!handleReset}
          className="flex items-center justify-start pl-4"
        >
          <p className="font-bold">{modalText}</p>
          <p className="">{modalDescription}</p>
        </ButtonWithModal>
        {/* Close Card Button */}
        <CloseButton onClick={onClose} />
        <HelpText className="help-bottom">{helpText}</HelpText>
      </div>
      {/* Content Area */}
      <div className="w-full grow p-4">{children}</div>
    </div>
  );
}
