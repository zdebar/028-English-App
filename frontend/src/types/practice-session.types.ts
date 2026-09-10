export type PracticeSessionMode = 'review' | 'new';

export type NewPracticePhase = 0 | 1;

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
  started_at: string;
  updated_at: string;
}
