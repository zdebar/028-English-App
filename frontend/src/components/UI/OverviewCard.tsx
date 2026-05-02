import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import CloseButton from './buttons/CloseButton';
import Card from './Card';
import DelayedNotification from './DelayedNotification';

type OverviewCardProps = Readonly<{
  buttonTitle?: string;
  modalTitle?: string;
  modalText?: string;
  helpText?: string;
  loading?: boolean;
  handleReset?: () => Promise<void>;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}>;

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
 * @param loading Whether the reset button should show a loading state.
 * @param handleReset Function to call to reset progress.
 * @param onClose Function to call when closing the card.
 * @param className Additional CSS classes for custom styling.
 * @param children Content to be displayed inside the content area.
 * @returns The rendered OverviewCard component.
 */
export default function OverviewCard({
  buttonTitle,
  modalTitle = TEXTS.restartProgress,
  modalText = TEXTS.restartDescription,
  helpText = TEXTS.restartProgressHelp,
  loading = false,
  handleReset,
  onClose,
  className = '',
  children,
}: OverviewCardProps): JSX.Element {
  const isDisabled = !handleReset || loading;
  return (
    <Card className={className}>
      {/* Top Bar */}
      <div className="relative flex items-center justify-between gap-1">
        <ButtonWithModal
          modalTitle={modalTitle}
          modalText={modalText}
          title={isDisabled ? '' : TEXTS.restartProgressHelp}
          onConfirm={async () => {
            if (handleReset) {
              await handleReset();
            }
            if (onClose) {
              onClose();
            }
          }}
          disabled={isDisabled}
          className="justify-start px-4"
        >
          {buttonTitle ||
            (!loading && <DelayedNotification>{TEXTS.notAvailable}</DelayedNotification>) ||
            ''}
        </ButtonWithModal>
        <CloseButton onClick={onClose} />
        <HelpText className="-bottom-2 left-2">{helpText}</HelpText>
      </div>
      {/* Content Area */}
      {children}
    </Card>
  );
}
