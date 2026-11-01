import VolumeSlider from '@/features/audio/VolumeSlider';
import type { UserItemLocal } from '@/types/user-item.types';
import type { JSX } from 'react';

type AudioItemListControlsProps = Readonly<{
  items: readonly Pick<UserItemLocal, 'audio'>[];
}>;

/** Volume control placed below a playable item list. */
export function AudioItemListControls({ items }: AudioItemListControlsProps): JSX.Element | null {
  if (items.length === 0) return null;
  const hasAudio = items.some((item) => Boolean(item.audio?.trim()));

  return (
    <div className="secondary-controls-after-list">
      <div className="pos-bottom-left-control">
        <VolumeSlider disabled={!hasAudio} />
      </div>
    </div>
  );
}
