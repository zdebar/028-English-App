import type {
  LessonType,
  LevelType,
  NoteType,
  UserLessonType,
} from '@/types/generic.types';
import type { GroupItemType, GroupRelationType, GroupType } from '@/types/table.types';
import type { PracticeDeckEntry, PracticeDeckItem, ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';

export type AppDataSnapshot = Readonly<{
  levels: readonly LevelType[];
  lessons: readonly LessonType[];
  notes: readonly NoteType[];
  groups: readonly GroupType[];
  group_items: readonly GroupItemType[];
  group_relations: readonly GroupRelationType[];
  user_items: readonly UserItemLocal[];
  user_lessons: readonly UserLessonType[];
}>;

export type TableChanges<Row, Key> = Readonly<{
  upserted?: readonly Row[];
  deleted?: readonly Key[];
}>;

export type AppDataChanges = Readonly<{
  levels?: TableChanges<LevelType, number>;
  lessons?: TableChanges<LessonType, number>;
  notes?: TableChanges<NoteType, number>;
  groups?: TableChanges<GroupType, number>;
  group_items?: TableChanges<GroupItemType, number>;
  group_relations?: TableChanges<GroupRelationType, number>;
  user_items?: TableChanges<UserItemLocal, number>;
  user_lessons?: TableChanges<UserLessonType, string>;
}>;

export type AppDataSyncResult = Readonly<{
  count: number;
  changes: AppDataChanges;
}>;

export type DataManagerStatus = 'idle' | 'loading' | 'ready' | 'error';

export type DataManagerState = AppDataSnapshot & Readonly<{
  userId: string | null;
  status: DataManagerStatus;
  error: Error | null;
  nowIso: string;
  localDate: string;
  reviewArrays: ReviewArrays;
  nextInitialLesson: PreparedInitialLesson | null;
}>;

export type VisibleGroup = GroupType & Readonly<{ examples: UserItemLocal[] }>;
export type GrammarChunkWithExamples = GroupType & Readonly<{ items: UserItemLocal[] }>;
export type GrammarGroupWithChunks = GroupType & Readonly<{
  kind: 'group';
  chunks: GrammarChunkWithExamples[];
}>;
export type GrammarTopicWithGroups = GroupType & Readonly<{ groups: GrammarGroupWithChunks[] }>;
export type SoundOverviewGroup = GroupType & Readonly<{ isActive: boolean }>;
export type SoundGroupDetail = Readonly<{ group: GroupType; items: UserItemLocal[] }>;
export type ReviewAvailability = Readonly<{
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
}>;
export type ReviewArrays = Readonly<Record<ReviewKind, readonly PracticeDeckItem[]>>;
export type PreparedInitialLesson = Readonly<{
  lesson: LessonType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GroupType | null;
}>;
export type ReviewDeckData = Readonly<{
  entries: PracticeDeckEntry[];
  prefetchedEntries?: PracticeDeckEntry[];
  availabilityCheckedAt: string;
  abandoned: boolean;
  reviewKind: ReviewKind;
  reviewDirection: ReviewDirection;
  availableCount?: number;
}>;

export const EMPTY_APP_DATA: AppDataSnapshot = {
  levels: [],
  lessons: [],
  notes: [],
  groups: [],
  group_items: [],
  group_relations: [],
  user_items: [],
  user_lessons: [],
};

export const EMPTY_REVIEW_ARRAYS: ReviewArrays = {
  grammar: [],
  vocabulary: [],
};
