import BilingualItemButton from '@/components/UI/buttons/BilingualItemButton';
import type { UserItemLocal } from '@/types/user-item.types';
import { isAudioPlayable, playAudioWithToast } from '@/features/audio/audio.utils';
import type { ReactNode } from 'react';

type AudioItemListProps = Readonly<{
  items: readonly UserItemLocal[];
  audioLoading: boolean;
  isAudioReady: (audio: string) => boolean;
  playAudio: (audio: string) => Promise<boolean>;
  showToast: (message: string, type: 'error') => void;
  showPronunciation?: boolean;
  hideCzechOnNarrow?: boolean;
  forceSingleLine?: boolean;
  itemClassName?: string;
  listClassName?: string;
  renderItemAction?: (item: UserItemLocal) => ReactNode;
}>;

/** Shared playable list for item collections. */
export default function AudioItemList({
  items,
  audioLoading,
  isAudioReady,
  playAudio,
  showToast,
  showPronunciation = false,
  hideCzechOnNarrow = false,
  forceSingleLine = false,
  itemClassName,
  listClassName,
  renderItemAction,
}: AudioItemListProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-1 ${listClassName ?? 'pt-1'} ${hideCzechOnNarrow ? 'pronunciation-item-list' : ''}`}
    >
      {items.map((item) => {
        const buttonProps = {
          item,
          showPronunciation,
          hideCzechOnNarrow,
          forceSingleLine,
          className: itemClassName,
          disabled: !isAudioPlayable(item.audio, audioLoading, isAudioReady),
          onClick: () => playAudioWithToast(item.audio, playAudio, showToast),
        };

        if (!renderItemAction) {
          return <BilingualItemButton key={item.item_id} {...buttonProps} />;
        }

        return (
          <div key={item.item_id} className="relative">
            <BilingualItemButton {...buttonProps} />
            {renderItemAction(item)}
          </div>
        );
      })}
    </div>
  );
}

