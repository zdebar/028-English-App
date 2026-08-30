import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import type { JSX, ReactNode } from 'react';
import ButtonWithModal from '@/features/modal/ButtonWithModal';
import Card from './Card';
import { CardHeader } from './CardHeader';
import DelayedNotification from './DelayedNotification';

const DEFAULT_OVERVIEW_CARD_PROPS = {
  modalTitle: TEXTS.restartProgress,
  modalText: TEXTS.restartDescription,
  helpText: TEXTS.restartProgressHelp,
  loading: false,
  className: '',
} as const;

function getOverviewCardButtonContent(
  buttonTitle: string | undefined,
  loading: boolean,
): ReactNode {
  if (buttonTitle !== undefined) return buttonTitle;
  if (loading) return '';
  return <DelayedNotification>{TEXTS.notAvailable}</DelayedNotification>;
}

async function confirmOverviewCardAction(
  handleReset: (() => Promise<void>) | undefined,
  onClose: (() => void) | undefined,
): Promise<void> {
  if (handleReset) await handleReset();
  if (onClose) onClose();
}

type OverviewCardProps = Readonly<{
  buttonTitle?: string;
  modalTitle?: string;
  modalText?: string;
  helpText?: string;
  loading?: boolean;
  handleReset?: () => Promise<void>;
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
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
export default function OverviewCard(props: OverviewCardProps): JSX.Element {
  const {
    buttonTitle,
    modalTitle,
    modalText,
    helpText,
    loading,
    handleReset,
    onClose,
    className,
    children,
  } = { ...DEFAULT_OVERVIEW_CARD_PROPS, ...props };
  const isDisabled = !handleReset || loading;
  return (
    <Card className={className}>
      <CardHeader onClose={onClose} className="relative">
        <ButtonWithModal
          modalTitle={modalTitle}
          modalText={modalText}
          title={isDisabled ? '' : TEXTS.restartProgressHelp}
          onConfirm={() => confirmOverviewCardAction(handleReset, onClose)}
          disabled={isDisabled}
          preserveEnabledTextColorWhenDisabled
          className="justify-start px-4"
        >
          {getOverviewCardButtonContent(buttonTitle, loading)}
        </ButtonWithModal>
        <HelpText className="-bottom-2 left-2">{helpText}</HelpText>
      </CardHeader>
      {children}
    </Card>
  );
}
