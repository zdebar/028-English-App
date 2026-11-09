import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import type { GroupType } from '@/types/table.types';
import type { PracticeDeckEntry } from '@/types/user-item.types';
import {
  selectGrammarOverview,
  selectLevelOverview,
  selectPracticeAvailability,
  selectPracticeGrammarContext,
  selectPreparedInitialLesson,
  selectPronunciationDetail,
  selectPronunciationOverview,
  selectReviewDeck,
  selectSoundDetail,
  selectSoundOverview,
  selectTopicDetail,
  selectTopicOverview,
  selectVocabulary,
} from './data-selectors';
import type {
  AppDataSnapshot,
  DataManagerState,
  DataPackageMap,
  DataPackageRequest,
  DataPackageValue,
  InitialTrainingPackage,
  ReviewDeckData,
  ReviewPracticePackage,
} from './data-types';

export type DataPackageDependencies = Readonly<{
  tables: readonly (keyof AppDataSnapshot)[];
  clock?: boolean;
  localDate?: boolean;
}>;

// -- Package dependencies and dispatch --
const USER_TABLES = ['user_items', 'user_lessons'] as const;
const ITEM_TABLES = ['user_items', 'user_lessons', 'lessons', 'groups', 'group_items'] as const;
const GRAMMAR_TABLES = ['user_items', 'user_lessons', 'lessons', 'groups', 'group_items', 'group_relations'] as const;
const SOUND_TABLES = ['user_items', 'user_lessons', 'groups', 'group_items'] as const;
const PRONUNCIATION_TABLES = ['user_items', 'user_lessons', 'groups', 'group_items', 'group_relations'] as const;
const REVIEW_TABLES = ['user_items', 'user_lessons', 'lessons', 'notes', 'groups', 'group_items', 'group_relations'] as const;
const INITIAL_TRAINING_TABLES = [
  'user_items',
  'user_lessons',
  'notes',
  'lessons',
  'groups',
  'group_items',
  'group_relations',
] as const;
const SHARED_TABLES = [
  'levels',
  'lessons',
  'notes',
  'groups',
  'group_items',
  'group_relations',
] as const;
const ALL_TABLES = [...SHARED_TABLES, ...USER_TABLES] as const;
const HOME_TABLES = ALL_TABLES;

export const DATA_PACKAGE_DEPENDENCIES: Readonly<Record<DataPackageRequest['kind'], DataPackageDependencies>> = {
  home: { tables: HOME_TABLES, clock: true, localDate: true },
  'overview-menu': { tables: ALL_TABLES },
  'grammar-overview': { tables: GRAMMAR_TABLES },
  'topics-overview': { tables: ITEM_TABLES },
  'topic-detail': { tables: ITEM_TABLES },
  vocabulary: { tables: ['user_items', 'notes', 'groups'] },
  'sounds-overview': { tables: SOUND_TABLES },
  'sound-detail': { tables: SOUND_TABLES },
  'pronunciation-overview': { tables: PRONUNCIATION_TABLES },
  'pronunciation-detail': { tables: PRONUNCIATION_TABLES },
  'review-practice': { tables: REVIEW_TABLES, clock: true },
  'initial-training': { tables: INITIAL_TRAINING_TABLES, clock: true },
};

type DataPackageBuilderMap = {
  [Kind in DataPackageRequest['kind']]: (
    state: DataManagerState,
    request: Extract<DataPackageRequest, { kind: Kind }>,
  ) => DataPackageMap[Kind];
};

const DATA_PACKAGE_BUILDERS = {
  home: buildHomePackage,
  'overview-menu': buildOverviewMenuPackage,
  'grammar-overview': buildGrammarOverviewPackage,
  'topics-overview': buildTopicsOverviewPackage,
  'topic-detail': buildTopicDetailPackage,
  vocabulary: buildVocabularyPackage,
  'sounds-overview': buildSoundsOverviewPackage,
  'sound-detail': buildSoundDetailPackage,
  'pronunciation-overview': buildPronunciationOverviewPackage,
  'pronunciation-detail': buildPronunciationDetailPackage,
  'review-practice': buildReviewPracticeRequest,
  'initial-training': buildInitialTrainingRequest,
} satisfies DataPackageBuilderMap;

// -- Package identity and construction --
export function getDataPackageKey(request: DataPackageRequest): string {
  switch (request.kind) {
    case 'topic-detail':
      return `${request.kind}:${request.topicId}`;
    case 'sound-detail':
    case 'pronunciation-detail':
      return `${request.kind}:${request.groupId}`;
    case 'review-practice':
      return `${request.kind}:${request.reviewKind}`;
    default:
      return request.kind;
  }
}

export function buildDataPackage<Request extends DataPackageRequest>(
  state: DataManagerState,
  request: Request,
): DataPackageValue<Request> {
  requireUserId(state);
  const builder = DATA_PACKAGE_BUILDERS[request.kind] as unknown as (
    source: DataManagerState,
    packageRequest: Request,
  ) => DataPackageValue<Request>;
  return builder(state, request);
}

// -- Home and overview packages --
function buildHomePackage(state: DataManagerState) {
  const userId = requireUserId(state);
  return {
    levels: selectLevelOverview(state, userId, state.localDate),
    practiceAvailability: selectPracticeAvailability(state, userId, new Date(state.nowIso)),
    hasActivePronunciationGroups: selectPronunciationOverview(state, userId)
      .some((group) => group.isActive),
    soundGroups: getSoundGroups(state),
  };
}

function buildOverviewMenuPackage(state: DataManagerState) {
  const userId = requireUserId(state);
  return {
    grammar: selectGrammarOverview(state, userId).length > 0,
    topics: selectTopicOverview(state, userId).length > 0,
    vocabulary: selectVocabulary(state, userId).length > 0,
    sounds: selectSoundOverview(state, userId).some((group) => group.isActive),
  };
}

function buildGrammarOverviewPackage(state: DataManagerState) {
  return selectGrammarOverview(state, requireUserId(state));
}

function buildTopicsOverviewPackage(state: DataManagerState) {
  return selectTopicOverview(state, requireUserId(state));
}

function buildTopicDetailPackage(
  state: DataManagerState,
  request: Extract<DataPackageRequest, { kind: 'topic-detail' }>,
) {
  return selectTopicDetail(state, requireUserId(state), request.topicId);
}

function buildVocabularyPackage(state: DataManagerState) {
  const items = selectVocabulary(state, requireUserId(state));
  const noteIds = new Set(items.flatMap((item) => item.note_id == null ? [] : [item.note_id]));
  return {
    items,
    notes: state.notes.filter((note) => noteIds.has(note.id)),
    soundGroups: getSoundGroups(state),
  };
}

function buildSoundsOverviewPackage(state: DataManagerState) {
  return selectSoundOverview(state, requireUserId(state));
}

function buildSoundDetailPackage(
  state: DataManagerState,
  request: Extract<DataPackageRequest, { kind: 'sound-detail' }>,
) {
  return selectSoundDetail(state, requireUserId(state), request.groupId);
}

function buildPronunciationOverviewPackage(state: DataManagerState) {
  return selectPronunciationOverview(state, requireUserId(state));
}

function buildPronunciationDetailPackage(
  state: DataManagerState,
  request: Extract<DataPackageRequest, { kind: 'pronunciation-detail' }>,
) {
  return selectPronunciationDetail(state, requireUserId(state), request.groupId);
}

// -- Practice packages --
function buildReviewPracticeRequest(
  state: DataManagerState,
  request: Extract<DataPackageRequest, { kind: 'review-practice' }>,
) {
  return buildReviewPracticePackage(state, requireUserId(state), request.reviewKind);
}

function buildInitialTrainingRequest(state: DataManagerState) {
  return buildInitialTrainingPackage(state, requireUserId(state));
}

function buildReviewPracticePackage(
  state: DataManagerState,
  userId: string,
  reviewKind: ReviewKind,
): ReviewPracticePackage {
  const now = state.nowIso;
  const initialDeck = enrichReviewDeck(state, userId, selectReviewDeck(state, userId, reviewKind, undefined, now));
  const decks: Record<ReviewDirection, ReviewDeckData> = {
    cz_to_en: enrichReviewDeck(state, userId, selectReviewDeck(state, userId, reviewKind, 'cz_to_en', now)),
    en_to_cz: enrichReviewDeck(state, userId, selectReviewDeck(state, userId, reviewKind, 'en_to_cz', now)),
  };
  return {
    availability: selectPracticeAvailability(state, userId, new Date(now)),
    initialDeck,
    decks,
    soundGroups: getSoundGroups(state),
  };
}

function enrichReviewDeck(
  state: DataManagerState,
  userId: string,
  deck: ReviewDeckData,
): ReviewDeckData {
  return {
    ...deck,
    entries: enrichEntries(state, userId, deck.entries),
    prefetchedEntries: deck.prefetchedEntries
      ? enrichEntries(state, userId, deck.prefetchedEntries)
      : undefined,
  };
}

function enrichEntries(
  state: DataManagerState,
  userId: string,
  entries: readonly PracticeDeckEntry[],
): PracticeDeckEntry[] {
  return entries.map(({ item }) => {
    const lesson = state.lessons.find((entry) => entry.id === item.lesson_id);
    const grammar = selectPracticeGrammarContext(state, userId, lesson?.group_id).grammar;
    return {
      item,
      note: state.notes.find((note) => note.id === item.note_id) ?? null,
      grammar,
    };
  });
}

function buildInitialTrainingPackage(state: DataManagerState, userId: string): InitialTrainingPackage {
  const prepared = selectPreparedInitialLesson(state, userId);
  if (!prepared?.lesson) return { ...EMPTY_INITIAL_TRAINING, soundGroups: getSoundGroups(state) };

  const lessonGroup = state.groups.find((group) => group.id === prepared.lesson?.group_id);
  return {
    ...prepared,
    groupNote: lessonGroup?.note ?? null,
    soundGroups: getSoundGroups(state),
  };
}

function getSoundGroups(state: AppDataSnapshot): GroupType[] {
  return state.groups.filter((group) => group.type === 'sound' && !group.deleted_at);
}

const EMPTY_INITIAL_TRAINING: Omit<InitialTrainingPackage, 'soundGroups'> = {
  lesson: null,
  items: [],
  entries: [],
  grammar: null,
  grammarGroup: null,
  groupNote: null,
};

function requireUserId(state: DataManagerState): string {
  if (!state.userId) throw new Error('Cannot build a data package without an active user.');
  return state.userId;
}
