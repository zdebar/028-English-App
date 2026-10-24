import type { UserItemLocal } from './user-item.types';
import type { GroupType } from './table.types';

export type PronunciationGroupType = Omit<GroupType, 'type'>;

export interface PronunciationGroupOverviewType extends PronunciationGroupType {
  examples: string[];
  unlocked_count: number;
  total_count: number;
}

export interface PronunciationGroupDetailType {
  group: PronunciationGroupType;
  sounds: Array<Pick<PronunciationGroupType, 'id' | 'name' | 'note'>>;
  items: UserItemLocal[];
}
