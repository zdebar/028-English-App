import type { PracticeDirection } from './user-item.types';

export type PracticeSessionMode = 'review' | 'new';

export type NewPracticePhase = 0 | 1;

export interface ReviewQueueEntry {
  item_id: number;
  direction: PracticeDirection;
}

export interface PracticeSessionType {
  user_id: string;
  mode: PracticeSessionMode;
  completed_count: number;
  target_count: number;
  block_id: number | null;
  phase: NewPracticePhase | null;
  current_queue_item_ids: number[];
  retry_queue_item_ids: number[];
  completed_item_ids: number[];
  /** Remaining review cards in their original order; absent on legacy sessions. */
  review_queue?: ReviewQueueEntry[];
  started_at: string;
  updated_at: string;
}
