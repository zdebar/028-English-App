import type { UserItemLocal } from './user-item.types';

export interface PronunciationGroupType {
  id: number;
  name: string;
  note: string | null;
  sort_order: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface PronunciationGroupItemType {
  pronunciation_group_id: number;
  item_id: number;
  sort_order: number;
  updated_at: string;
  deleted_at: string | null;
}

export interface PronunciationGroupOverviewType extends PronunciationGroupType {
  examples: string[];
  started_count: number;
  total_count: number;
}

export interface PronunciationGroupDetailType {
  group: PronunciationGroupType;
  items: UserItemLocal[];
  selected_count: number;
  available_count: number;
}
