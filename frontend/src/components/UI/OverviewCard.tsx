import CloseButton from '@/components/UI/buttons/CloseButton';
import { TEXTS } from '@/locales/cs';
import ButtonWithModal from '../../features/modal/ButtonWithModal';
import HelpText from '@/features/help/HelpText';
import type { JSX } from 'react';

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
 * OverviewCard component for displaying a card with a title, actions, and content.
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
      <div className="flex items-center justify-between gap-1">
        {/* Title and Reset Button */}
        <ButtonWithModal
          buttonText={titleText}
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
        {/* Close Card Button */}
        <CloseButton onClick={onClose} />
      </div>
      <HelpText className="help-top">{helpText}</HelpText>
      {/* Content Area */}
      <div className="w-full grow p-4">{children}</div>
    </div>
  );
}
