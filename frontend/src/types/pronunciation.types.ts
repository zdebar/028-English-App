import type { UserItemLocal } from './user-item.types';
import type { GroupType, SoundClass } from './table.types';

export type PronunciationGroupType = Omit<GroupType, 'type' | 'sound_class' | 'sound_category'>;

export interface PronunciationGroupOverviewType extends PronunciationGroupType {
  contrast_class: SoundClass;
  isActive: boolean;
  examples: string[];
  unlocked_count: number;
  total_count: number;
}

export interface PronunciationGroupDetailType {
  group: PronunciationGroupType;
  sounds: Array<Pick<PronunciationGroupType, 'id' | 'name' | 'note'>>;
  items: UserItemLocal[];
}
