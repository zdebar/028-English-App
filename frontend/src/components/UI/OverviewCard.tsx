import CloseButton from '@/components/UI/buttons/CloseButton';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import ModalButton from '@/features/modal/ModalButton';

interface OverviewCardProps {
  buttonTitle?: string;
  modalTitle?: string;
  modalText?: string;
  helpText?: string;
  handleReset?: () => Promise<void>;
  onClose: () => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * OverviewCard component for displaying a card with a title, and content.
 * Title button triggers confirmation modal for handleReset function.
 * If handleReset is not provided, the reset button is disabled.
 * Component doesn't handle errors. Errors should be handled in the parent component.
 *
 * @param buttonTitle Text to display on the button.
 * @param modalTitle Title for the confirmation modal.
 * @param modalText Description for the confirmation modal.
 * @param helpText Description for the help tooltip.
 * @param handleReset Function to call to reset progress.
 * @param onClose Function to call when closing the card.
 * @param className Additional CSS classes for custom styling.
 * @param children Content to be displayed inside the content area.
 * @returns The rendered OverviewCard component.
 */
export default function OverviewCard({
  buttonTitle = TEXTS.notAvailable,
  modalTitle = TEXTS.restartProgress,
  modalText = TEXTS.restartDescription,
  helpText = TEXTS.restartProgressHelp,
  handleReset,
  onClose,
  className = '',
  children,
}: OverviewCardProps): JSX.Element {
  return (
    <div className={`card-width ${className}`}>
      {/* Top Bar */}
      <div className="relative flex items-center justify-between gap-1">
        {/* Title and Reset Button */}
        <ModalButton
          modalTitle={modalTitle}
          modalText={modalText}
          onConfirm={async () => {
            if (handleReset) {
              await handleReset();
            }
            onClose();
          }}
          disabled={!handleReset}
          className="flex items-center justify-start px-4"
        >
          {buttonTitle}
        </ModalButton>
        {/* Close Card Button */}
        <CloseButton onClick={onClose} />
        <HelpText className="-bottom-2 left-2">{helpText}</HelpText>
      </div>
      {/* Content Area */}
      <div className="w-full grow p-4">{children}</div>
    </div>
  );
}
