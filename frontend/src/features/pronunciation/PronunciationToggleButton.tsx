import SecondaryControlButton from '@/components/UI/buttons/SecondaryControlButton';
import MicrophoneIcon from '@/components/UI/icons/MicrophoneIcon';
import UserItem from '@/database/models/user-items';
import HelpText from '@/features/help/HelpText';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useLiveQuery } from 'dexie-react-hooks';
import type { MouseEvent } from 'react';

type PronunciationToggleButtonProps = Readonly<{
  userId: string | null;
  item: UserItemLocal | null;
  showHelpText?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}>;

function getToggleTitle(hasAudio: boolean, selected: boolean) {
  if (!hasAudio) return TEXTS.pronunciationAudioRequired;
  return selected ? TEXTS.removeFromPronunciation : TEXTS.addToPronunciation;
}

async function getPronunciationSelection(userId: string | null, itemId: number | undefined) {
  if (!userId || itemId === undefined) return false;
  return UserItem.getPronunciationSelection(userId, itemId);
}

async function togglePronunciationSelection(
  event: MouseEvent<HTMLButtonElement>,
  disabled: boolean,
  userId: string | null,
  item: UserItemLocal | null,
  onSelectionChange: ((selected: boolean) => void) | undefined,
  showToast: (message: string, type: 'error') => void,
): Promise<void> {
  event.stopPropagation();
  if (disabled || !userId || !item) return;
  try {
    const enabled = await UserItem.togglePronunciationPractice(userId, item.item_id);
    if (enabled === null) return;
    onSelectionChange?.(enabled);
  } catch (error) {
    reportError('Failed to toggle pronunciation practice item', error);
    showToast(TEXTS.pronunciationToggleError, 'error');
  }
}

export default function PronunciationToggleButton(props: PronunciationToggleButtonProps) {
  const { userId, item, showHelpText, onSelectionChange } = {
    showHelpText: false,
    ...props,
  };
  const showToast = useToastStore((state) => state.showToast);
  const selected = useLiveQuery(
    () => getPronunciationSelection(userId, item?.item_id),
    [userId, item?.item_id],
    item?.has_pronunciation_practice === 1,
  );
  const hasAudio = Boolean(item?.audio?.trim());
  const disabled = !userId || !item || !hasAudio;
  const title = getToggleTitle(hasAudio, selected);

  return (
    <SecondaryControlButton
      title={title}
      ariaLabel={TEXTS.pronunciationToggleAria}
      aria-pressed={selected}
      disabled={disabled}
      className={`${selected ? 'pronunciation-control-emphasis' : ''} pb-1`}
      onClick={(event) => {
        void togglePronunciationSelection(
          event,
          disabled,
          userId,
          item,
          onSelectionChange,
          showToast,
        );
      }}
    >
      <MicrophoneIcon />
      {showHelpText && (
        <HelpText className="-bottom-4 -left-22 flex flex-col items-start landscape:invisible">
          {selected ? TEXTS.removeFromPronunciationHelp : TEXTS.addToPronunciationHelp}
        </HelpText>
      )}
    </SecondaryControlButton>
  );
}
