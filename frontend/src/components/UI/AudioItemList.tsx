import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import type { UserItemLocal } from '@/types/user-item.types';
import { playAudioWithToast } from '@/features/audio/audio.utils';

type AudioItemListProps = Readonly<{
  items: readonly UserItemLocal[];
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
  showPronunciation?: boolean;
  itemClassName?: string;
}>;

/** Shared playable list for vocabulary and grammar examples. */
export default function AudioItemList({
  items,
  audioLoading,
  isAudioReady,
  playAudio,
  showToast,
  showPronunciation = false,
  itemClassName,
}: AudioItemListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 pt-1">
      {items.map((item) => (
        <BilingualItemButton
          key={item.item_id}
          item={item}
          showPronunciation={showPronunciation}
          className={itemClassName}
          disabled={isAudioDisabled(item.audio, audioLoading, isAudioReady)}
          onClick={() => playAudioWithToast(item.audio, playAudio, showToast)}
        />
      ))}
    </div>
  );
}

function isAudioDisabled(
  audio: string | null | undefined,
  audioLoading: boolean,
  isAudioReady: (audio: string) => boolean,
): boolean {
  if (!audio?.trim()) return true;
  return audioLoading || !isAudioReady(audio);
}

