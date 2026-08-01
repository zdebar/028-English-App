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

function getToggleTitle(isVocabulary: boolean, hasAudio: boolean, selected: boolean) {
  if (!isVocabulary) return TEXTS.pronunciationVocabularyOnly;
  if (!hasAudio) return TEXTS.pronunciationAudioRequired;
  return selected ? TEXTS.removeFromPronunciation : TEXTS.addToPronunciation;
}

export default function PronunciationToggleButton({
  userId,
  item,
  showHelpText = false,
  onSelectionChange,
}: PronunciationToggleButtonProps) {
  const showToast = useToastStore((state) => state.showToast);
  const selected = useLiveQuery(
    async () => {
      if (!userId || !item) return false;
      return UserItem.getPronunciationSelection(userId, item.item_id);
    },
    [userId, item?.item_id],
    item?.has_pronunciation_practice === 1,
  );
  const isVocabulary = item?.is_vocabulary === 1;
  const hasAudio = Boolean(item?.audio?.trim());
  const disabled = !userId || !item || !isVocabulary || !hasAudio;
  const title = getToggleTitle(isVocabulary, hasAudio, selected);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (disabled || !userId || !item) return;
    try {
      const enabled = await UserItem.togglePronunciationPractice(userId, item.item_id);
      onSelectionChange?.(enabled);
    } catch (error) {
      reportError('Failed to toggle pronunciation practice item', error);
      showToast(TEXTS.pronunciationToggleError, 'error');
    }
  };

  return (
    <SecondaryControlButton
      title={title}
      ariaLabel={TEXTS.pronunciationToggleAria}
      aria-pressed={selected}
      disabled={disabled}
      className={`${selected ? 'pronunciation-control-emphasis' : ''} pb-1`}
      onClick={(event) => {
        void handleClick(event);
      }}
    >
      <MicrophoneIcon />
      {showHelpText && (
        <HelpText className="-bottom-4 left-2 flex flex-col items-start landscape:invisible">
          {selected ? TEXTS.removeFromPronunciationHelp : TEXTS.addToPronunciationHelp}
        </HelpText>
      )}
    </SecondaryControlButton>
  );
}
