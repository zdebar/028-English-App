import type {
  LessonType,
  LevelType,
  NoteType,
  UserLessonType,
} from '@/types/generic.types';
import type { GroupItemType, GroupRelationType, GroupType } from '@/types/table.types';
import type { PracticeDeckEntry, PracticeDeckItem, ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import type { ReviewDirection, ReviewDueCounts, ReviewKind } from '@/types/practice.types';
import type { PronunciationGroupDetailType, PronunciationGroupOverviewType } from '@/types/pronunciation.types';

export type PracticeAvailabilityData = ReviewAvailability & Readonly<{
  initialTrainingAvailable: boolean;
}>;

export type OverviewAvailabilityData = Readonly<{
  grammar: boolean;
  topics: boolean;
  vocabulary: boolean;
  sounds: boolean;
}>;

export type TopicDetailData = Readonly<{
  topic: GroupType | null;
  items: UserItemLocal[];
}>;

export type HomeDataPackage = Readonly<{
  levels: ReturnType<typeof import('@/database/models/levels').aggregateLevels>;
  practiceAvailability: PracticeAvailabilityData;
  hasActivePronunciationGroups: boolean;
  soundGroups: GroupType[];
}>;

export type ReviewPracticePackage = Readonly<{
  availability: PracticeAvailabilityData;
  initialDeck: ReviewDeckData;
  decks: Readonly<Record<ReviewDirection, ReviewDeckData>>;
  soundGroups: GroupType[];
}>;

export type VocabularyPackage = Readonly<{
  items: UserItemLocal[];
  notes: NoteType[];
  soundGroups: GroupType[];
}>;

export type InitialTrainingPackage = PreparedInitialLesson & Readonly<{
  groupNote: string | null;
  soundGroups: GroupType[];
}>;

export type DataPackageMap = Readonly<{
  home: HomeDataPackage;
  'overview-menu': OverviewAvailabilityData;
  'grammar-overview': GrammarTopicWithGroups[];
  'topics-overview': GroupType[];
  'topic-detail': TopicDetailData;
  vocabulary: VocabularyPackage;
  'sounds-overview': SoundOverviewGroup[];
  'sound-detail': SoundGroupDetail | null;
  'pronunciation-overview': PronunciationGroupOverviewType[];
  'pronunciation-detail': PronunciationGroupDetailType | null;
  'review-practice': ReviewPracticePackage;
  'initial-training': InitialTrainingPackage;
}>;

export type DataPackageRequest =
  | Readonly<{ kind: 'home' }>
  | Readonly<{ kind: 'overview-menu' }>
  | Readonly<{ kind: 'grammar-overview' }>
  | Readonly<{ kind: 'topics-overview' }>
  | Readonly<{ kind: 'topic-detail'; topicId: number }>
  | Readonly<{ kind: 'vocabulary' }>
  | Readonly<{ kind: 'sounds-overview' }>
  | Readonly<{ kind: 'sound-detail'; groupId: number }>
  | Readonly<{ kind: 'pronunciation-overview' }>
  | Readonly<{ kind: 'pronunciation-detail'; groupId: number }>
  | Readonly<{ kind: 'review-practice'; reviewKind: ReviewKind }>
  | Readonly<{ kind: 'initial-training' }>;

export type DataPackageValue<Request extends DataPackageRequest> = DataPackageMap[Request['kind']];

export type CachedDataPackage = Readonly<{
  request: DataPackageRequest;
  data: unknown;
  error: Error | null;
}>;

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
  dataPackages: Readonly<Record<string, CachedDataPackage>>;
}>;

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
  reviewDueCounts: ReviewDueCounts;
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
