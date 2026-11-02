import config from '@/config/config';
import { aggregateLevels } from '@/database/models/levels';
import { isReviewItemCandidate, isReviewItemDue, isReviewItemFuture, isReviewItemReadyAt } from '@/database/practice/review-items';
import { compareCurriculumPaths, isInitialTrainingSkipped } from '@/database/practice/user-item-practice';
import { isInitiated } from '@/database/practice/user-item-progress';
import type {
  GrammarChunkWithExamples,
  GrammarGroupWithChunks,
  GrammarTopicWithGroups,
  DataManagerState,
  PreparedInitialLesson,
  ReviewAvailability,
  ReviewDeckData,
  SoundGroupDetail,
  SoundOverviewGroup,
  AppDataSnapshot,
} from './data-types';
import type { PronunciationGroupDetailType, PronunciationGroupOverviewType } from '@/types/pronunciation.types';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import type { GroupItemType, GroupRelationType, GroupType, SoundClass } from '@/types/table.types';
import type { PracticeDeckEntry, PracticeDeckItem, UserItemLocal } from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;
const RESET_SORT_DATE = '0000-01-01T00:00:00.000Z';
const REVIEW_KINDS: readonly ReviewKind[] = ['grammar', 'vocabulary'];
const REVIEW_DIRECTIONS: readonly ReviewDirection[] = ['cz_to_en', 'en_to_cz'];
type AppDataSource = AppDataSnapshot & Partial<Pick<DataManagerState, 'reviewArrays' | 'nextInitialLesson'>>;

export function selectStartedGroups(
  data: AppDataSnapshot,
  userId: string,
  type?: GroupType['type'],
): Array<GroupType & { examples: UserItemLocal[] }> {
  const startedLessonIds = new Set(data.user_lessons
    .filter((lesson) => lesson.user_id === userId)
    .map((lesson) => lesson.lesson_id));
  const startedItems = new Map(data.user_items
    .filter((item) => item.user_id === userId && item.deleted_at === NULL_DATE && isInitiated(item))
    .filter((item) => startedLessonIds.has(item.lesson_id))
    .map((item) => [item.item_id, item] as const));
  const membershipsByGroup = new Map<number, GroupItemType[]>();

  for (const membership of data.group_items) {
    const memberships = membershipsByGroup.get(membership.group_id) ?? [];
    memberships.push(membership);
    membershipsByGroup.set(membership.group_id, memberships);
  }

  return data.groups
    .filter((group) => !group.deleted_at && (!type || group.type === type))
    .sort(compareGroups)
    .flatMap((group) => {
      const memberships = [...(membershipsByGroup.get(group.id) ?? [])]
        .filter((membership) => membership.deleted_at == null)
        .sort((left, right) => left.sort_order - right.sort_order);
      const examples = memberships.flatMap((membership) => {
        const item = startedItems.get(membership.item_id);
        return item ? [item] : [];
      });
      return examples.length > 0 ? [{ ...group, examples }] : [];
    });
}

export function selectGroupsWithStartedLessons(
  data: AppDataSnapshot,
  userId: string,
  type: GroupType['type'],
): GroupType[] {
  const startedLessonIds = new Set(data.user_lessons
    .filter((lesson) => lesson.user_id === userId)
    .map((lesson) => lesson.lesson_id));
  const itemIdsInStartedLessons = new Set(data.user_items
    .filter((item) => item.user_id === userId && item.deleted_at === NULL_DATE)
    .filter((item) => startedLessonIds.has(item.lesson_id))
    .map((item) => item.item_id));
  const visibleGroupIds = new Set(data.group_items
    .filter((membership) => membership.deleted_at == null && itemIdsInStartedLessons.has(membership.item_id))
    .map((membership) => membership.group_id));

  return data.groups
    .filter((group) => group.type === type && !group.deleted_at && visibleGroupIds.has(group.id))
    .sort(compareGroups);
}

export function selectGrammarOverview(data: AppDataSnapshot, userId: string): GrammarTopicWithGroups[] {
  const groups = data.groups.filter((group) => group.type === 'grammar' && !group.deleted_at);
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const startedById = new Map(selectStartedGroups(data, userId, 'grammar').map((group) => [group.id, group]));
  const hierarchy = data.group_relations
    .filter((relation) => relation.relation_type === 'hierarchy' && !relation.deleted_at)
    .sort(compareRelations);
  const detailsByParentId = new Map<number, GroupRelationType[]>();
  for (const relation of data.group_relations
    .filter((entry) => entry.relation_type === 'detail' && !entry.deleted_at)
    .sort(compareRelations)) {
    const details = detailsByParentId.get(relation.parent_group_id) ?? [];
    details.push(relation);
    detailsByParentId.set(relation.parent_group_id, details);
  }

  const middleByRoot = new Map<number, GrammarGroupWithChunks[]>();
  for (const relation of hierarchy) {
    const root = groupById.get(relation.parent_group_id);
    const middle = groupById.get(relation.child_group_id);
    if (!root || !middle) continue;
    const chunkRelations = detailsByParentId.get(middle.id) ?? [];
    const chunks = chunkRelations.flatMap((chunkRelation) => {
      const chunk = groupById.get(chunkRelation.child_group_id);
      const started = startedById.get(chunkRelation.child_group_id);
      return chunk && started ? [{ ...chunk, items: started.examples }] : [];
    });
    if (chunks.length === 0) continue;
    const rootGroups = middleByRoot.get(root.id) ?? [];
    rootGroups.push({ ...middle, kind: 'group', chunks });
    middleByRoot.set(root.id, rootGroups);
  }

  return [...middleByRoot.entries()]
    .flatMap(([rootId, rootGroups]) => {
      const root = groupById.get(rootId);
      if (!root) return [];
      rootGroups.sort(compareGroups);
      return [{ ...root, groups: rootGroups }];
    })
    .sort(compareGroups);
}

export function selectTopicOverview(data: AppDataSnapshot, userId: string): GroupType[] {
  return selectStartedGroups(data, userId, 'topic').map(({ examples: _examples, ...topic }) => topic);
}

export function selectTopicDetail(
  data: AppDataSnapshot,
  userId: string,
  topicId: number,
): { topic: GroupType | null; items: UserItemLocal[] } {
  const started = selectStartedGroups(data, userId, 'topic').find((group) => group.id === topicId);
  if (!started) return { topic: null, items: [] };
  const { examples, ...topic } = started;
  return { topic, items: examples };
}

export function selectVocabulary(data: AppDataSnapshot, userId: string): UserItemLocal[] {
  return data.user_items.filter((item) =>
    item.user_id === userId &&
    item.is_vocabulary === 1 &&
    item.deleted_at === NULL_DATE &&
    isInitiated(item),
  );
}

export function selectSoundOverview(data: AppDataSnapshot, userId: string): SoundOverviewGroup[] {
  const activeIds = new Set(selectGroupsWithStartedLessons(data, userId, 'sound').map((group) => group.id));
  return data.groups
    .filter((group) => group.type === 'sound' && !group.deleted_at)
    .sort(compareGroups)
    .map((group) => ({ ...group, isActive: activeIds.has(group.id) }));
}

export function selectSoundDetail(
  data: AppDataSnapshot,
  userId: string,
  groupId: number,
): SoundGroupDetail | null {
  const group = selectGroupsWithStartedLessons(data, userId, 'sound').find((entry) => entry.id === groupId);
  if (!group) return null;
  const startedGroup = selectStartedGroups(data, userId, 'sound').find((entry) => entry.id === groupId);
  return { group, items: startedGroup?.examples ?? [] };
}

export function selectPronunciationOverview(
  data: AppDataSnapshot,
  userId: string,
): PronunciationGroupOverviewType[] {
  const groups = getAllGroupsWithStartedExamples(data, userId, 'pronunciation');
  const activeSoundIds = new Set(selectGroupsWithStartedLessons(data, userId, 'sound').map((group) => group.id));
  const relationsByGroup = getContrastRelationsByGroup(data);
  const soundById = new Map(data.groups
    .filter((group) => group.type === 'sound' && !group.deleted_at)
    .map((group) => [group.id, group]));

  return groups.map((group) => {
    const eligible = group.examples.filter((item) => Boolean(item.audio?.trim()));
    const relatedIds = relationsByGroup.get(group.id) ?? [];
    const { type: _type, sound_class: _soundClass, sound_category: _soundCategory, ...groupData } = group;
    return {
      ...groupData,
      contrast_class: getContrastClass(relatedIds, soundById),
      isActive: relatedIds.length > 0 && relatedIds.every((id) => activeSoundIds.has(id)),
      examples: eligible.slice(0, 4).map((item) => item.english),
      unlocked_count: eligible.length,
      total_count: eligible.length,
    };
  });
}

export function selectPronunciationDetail(
  data: AppDataSnapshot,
  userId: string,
  groupId: number,
): PronunciationGroupDetailType | null {
  const group = getAllGroupsWithStartedExamples(data, userId, 'pronunciation')
    .find((entry) => entry.id === groupId);
  if (!group) return null;
  const relations = data.group_relations
    .filter((relation) => relation.parent_group_id === groupId && relation.relation_type === 'contrast' && !relation.deleted_at)
    .sort((left, right) => left.sort_order - right.sort_order);
  const startedSounds = new Map(selectStartedGroups(data, userId, 'sound').map((sound) => [sound.id, sound]));
  const contrastIds = new Set(relations.map((relation) => relation.child_group_id));
  const membershipOrder = new Map(data.group_items
    .filter((membership) => contrastIds.has(membership.group_id) && !membership.deleted_at)
    .map((membership) => [`${membership.group_id}:${membership.item_id}`, membership.sort_order]));
  const orderedItems = relations.flatMap((relation) => {
    const sound = startedSounds.get(relation.child_group_id);
    return (sound?.examples ?? []).map((item) => ({
      item,
      itemSortOrder: membershipOrder.get(`${relation.child_group_id}:${item.item_id}`) ?? Number.MAX_SAFE_INTEGER,
      groupSortOrder: sound?.sort_order ?? Number.MAX_SAFE_INTEGER,
    }));
  }).sort((left, right) =>
    left.itemSortOrder - right.itemSortOrder ||
    left.groupSortOrder - right.groupSortOrder ||
    left.item.item_id - right.item.item_id,
  );
  const sounds = data.groups
    .filter((sound) => contrastIds.has(sound.id) && sound.type === 'sound' && !sound.deleted_at)
    .sort(compareGroups)
    .map(({ id, name, note }) => ({ id, name, note }));
  const { type: _type, sound_class: _soundClass, sound_category: _soundCategory, ...groupData } = group;

  return {
    group: groupData,
    sounds,
    items: [...new Map(orderedItems.map(({ item }) => [item.item_id, item])).values()],
  };
}

export function selectLevelOverview(data: AppDataSnapshot, userId: string, today: string): ReturnType<typeof aggregateLevels> {
  const startedLessonIds = new Set(data.user_lessons
    .filter((lesson) => lesson.user_id === userId)
    .map((lesson) => lesson.lesson_id));
  return aggregateLevels(
    data.user_items.filter((item) => item.user_id === userId),
    [...data.lessons],
    [...data.levels],
    today,
    startedLessonIds,
  );
}

export function selectReviewArrays(data: AppDataSnapshot, userId: string): Readonly<Record<ReviewKind, readonly PracticeDeckItem[]>> {
  const userItems = data.user_items.filter((item) => item.user_id === userId);
  const arrays: Record<ReviewKind, PracticeDeckItem[]> = { grammar: [], vocabulary: [] };
  for (const kind of REVIEW_KINDS) {
    arrays[kind] = sortReviewItems(userItems.flatMap((item) => REVIEW_DIRECTIONS.flatMap((direction) =>
      isReviewItemCandidate(item, kind, direction) ? [{ ...item, review_direction: direction }] : [],
    )));
  }
  return arrays;
}

export function selectReviewAvailability(
  data: AppDataSource,
  userId: string,
  nowIso: string,
): ReviewAvailability {
  const arrays = data.reviewArrays ?? selectReviewArrays(data, userId);
  const grammarReviewDueCount = getDueCount(arrays.grammar, nowIso);
  const vocabularyReviewDueCount = getDueCount(arrays.vocabulary, nowIso);
  return {
    grammarReviewReadyAt: getReviewReadyAt(arrays.grammar, config.practice.grammarReviewLimitSize, nowIso),
    vocabularyReviewReadyAt: getReviewReadyAt(arrays.vocabulary, config.practice.vocabularyReviewLimitSize, nowIso),
    grammarReviewDueCount,
    vocabularyReviewDueCount,
    nextReviewAt: earlierDate(getNextReviewAt(arrays.grammar, nowIso), getNextReviewAt(arrays.vocabulary, nowIso)),
  };
}

export function selectReviewDeck(
  data: AppDataSource,
  userId: string,
  reviewKind: ReviewKind,
  requestedDirection?: ReviewDirection,
  now = new Date().toISOString(),
): ReviewDeckData {
  const arrays = data.reviewArrays ?? selectReviewArrays(data, userId);
  const allowFallback = requestedDirection === undefined;
  let direction = requestedDirection ?? 'cz_to_en';
  let selected = arrays[reviewKind].filter((item) => item.review_direction === direction);
  let other = arrays[reviewKind].filter((item) => item.review_direction !== direction);
  let due = selected.filter((item) => isReviewItemDue(item, now, direction));
  if (due.length === 0 && allowFallback && direction === 'cz_to_en') {
    direction = 'en_to_cz';
    [selected, other] = [other, selected];
    due = selected.filter((item) => isReviewItemDue(item, now, direction));
  }
  const entries = due.map(toPracticeEntry);
  return {
    entries,
    prefetchedEntries: selected.map(toPracticeEntry),
    availabilityCheckedAt: now,
    abandoned: entries.length === 0,
    reviewKind,
    reviewDirection: direction,
    availableCount: countDue(selected, other, now),
  };
}

export function selectPreparedInitialLesson(data: AppDataSource, userId: string): PreparedInitialLesson | null {
  if ('nextInitialLesson' in data) return data.nextInitialLesson ?? null;
  return buildPreparedInitialLesson(data, userId);
}

export function buildPreparedInitialLesson(data: AppDataSnapshot, userId: string): PreparedInitialLesson | null {
  const items = data.user_items
    .filter((item) => item.user_id === userId)
    .filter((item) =>
      item.deleted_at === NULL_DATE &&
      item.is_cz_to_en_enabled !== false &&
      item.started_at === NULL_DATE &&
      !isInitialTrainingSkipped(item),
    )
    .sort((left, right) => compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path));
  const firstItem = items[0];
  if (!firstItem) return null;
  const lesson = data.lessons.find((entry) => entry.id === firstItem.lesson_id && !entry.deleted_at);
  if (!lesson) return null;
  const lessonItems = items.filter((item) => item.lesson_id === firstItem.lesson_id);
  const entries = resolvePracticeEntriesFromSnapshot(data, lessonItems);
  const grammarContext = resolveGrammarContext(data, lesson.group_id, userId);
  return { lesson, items: lessonItems, entries, grammar: grammarContext.grammar, grammarGroup: grammarContext.grammarGroup };
}

export function selectHasStartedLessonToday(
  data: AppDataSnapshot,
  userId: string,
  lessonId: number,
  now = new Date(),
): boolean {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return data.user_lessons.some((entry) =>
    entry.user_id === userId && entry.lesson_id === lessonId && entry.started_at >= start && entry.started_at < end,
  );
}

export function selectPracticeAvailability(data: AppDataSource, userId: string, now = new Date()): {
  grammarReviewReadyAt: string | null;
  vocabularyReviewReadyAt: string | null;
  grammarReviewDueCount: number;
  vocabularyReviewDueCount: number;
  nextReviewAt: string | null;
  initialTrainingAvailable: boolean;
  continuingInitialLessonToday: boolean;
} {
  const review = selectReviewAvailability(data, userId, now.toISOString());
  const initialLesson = selectPreparedInitialLesson(data, userId);
  return {
    ...review,
    initialTrainingAvailable: initialLesson !== null,
    continuingInitialLessonToday: initialLesson?.lesson
      ? selectHasStartedLessonToday(data, userId, initialLesson.lesson.id, now)
      : false,
  };
}

export function selectPracticeGrammarContext(
  data: AppDataSnapshot,
  userId: string,
  groupId: number | null | undefined,
): { grammar: GrammarChunkWithExamples | null; grammarGroup: GroupType | null } {
  return resolveGrammarContext(data, groupId, userId);
}

function getAllGroupsWithStartedExamples(data: AppDataSnapshot, userId: string, type: GroupType['type']) {
  const examplesById = new Map(selectStartedGroups(data, userId, type).map((group) => [group.id, group.examples]));
  return data.groups
    .filter((group) => group.type === type && !group.deleted_at)
    .sort(compareGroups)
    .map((group) => ({ ...group, examples: examplesById.get(group.id) ?? [] }));
}

function resolvePracticeEntriesFromSnapshot(
  data: AppDataSnapshot,
  items: readonly UserItemLocal[],
): PreparedInitialLesson['entries'] {
  return items.map((item) => ({
    item,
    note: data.notes.find((note) => note.id === item.note_id) ?? null,
    grammar: resolveGrammarForItem(data, item),
  }));
}

function resolveGrammarForItem(data: AppDataSnapshot, item: UserItemLocal): GrammarChunkWithExamples | null {
  const lesson = data.lessons.find((entry) => entry.id === item.lesson_id);
  const group = lesson?.group_id == null ? null : data.groups.find((entry) => entry.id === lesson.group_id);
  if (group?.type !== 'grammar' || group.deleted_at) return null;
  return { ...group, items: getGroupExamples(data, item.user_id, group.id) };
}

function resolveGrammarContext(
  data: AppDataSnapshot,
  groupId: number | null | undefined,
  userId: string,
): { grammar: GrammarChunkWithExamples | null; grammarGroup: GroupType | null } {
  if (typeof groupId !== 'number' || groupId <= 0) return { grammar: null, grammarGroup: null };
  const group = data.groups.find((entry) => entry.id === groupId && entry.type === 'grammar' && !entry.deleted_at);
  if (!group) return { grammar: null, grammarGroup: null };
  const parentRelation = data.group_relations.find((relation) =>
    relation.child_group_id === group.id && relation.relation_type === 'detail' && !relation.deleted_at,
  );
  const parent = parentRelation
    ? data.groups.find((entry) => entry.id === parentRelation.parent_group_id && entry.type === 'grammar' && !entry.deleted_at) ?? null
    : null;
  return { grammar: { ...group, items: getGroupExamples(data, userId, groupId) }, grammarGroup: parent };
}

function getGroupExamples(data: AppDataSnapshot, userId: string, groupId: number): UserItemLocal[] {
  const itemById = new Map(data.user_items
    .filter((item) => item.user_id === userId)
    .map((item) => [item.item_id, item]));
  return data.group_items
    .filter((membership) => membership.group_id === groupId && !membership.deleted_at)
    .sort((left, right) => left.sort_order - right.sort_order)
    .flatMap((membership) => {
      const item = itemById.get(membership.item_id);
      return item ? [item] : [];
    });
}

function getContrastRelationsByGroup(data: AppDataSnapshot): Map<number, number[]> {
  const relations = new Map<number, number[]>();
  for (const relation of data.group_relations) {
    if (relation.relation_type !== 'contrast' || relation.deleted_at) continue;
    const ids = relations.get(relation.parent_group_id) ?? [];
    ids.push(relation.child_group_id);
    relations.set(relation.parent_group_id, ids);
  }
  return relations;
}

function getContrastClass(ids: readonly number[], groups: ReadonlyMap<number, GroupType>): SoundClass {
  return ids.length > 0 && ids.every((id) => groups.get(id)?.sound_class === 'vowel') ? 'vowel' : 'consonant';
}

function compareGroups(left: GroupType, right: GroupType): number {
  return left.sort_order - right.sort_order || left.id - right.id;
}

function compareRelations(left: GroupRelationType, right: GroupRelationType): number {
  return left.sort_order - right.sort_order || left.id - right.id;
}

function sortReviewItems(items: readonly PracticeDeckItem[]): PracticeDeckItem[] {
  return [...items].sort(compareReviewItems);
}

export function compareReviewItems(left: PracticeDeckItem, right: PracticeDeckItem): number {
  const leftNextAt = getDirectionalNextAt(left);
  const rightNextAt = getDirectionalNextAt(right);
  const dateComparison = leftNextAt.localeCompare(rightNextAt);
  if (dateComparison !== 0) return dateComparison;
  return compareCurriculumPaths(left.curriculum_sort_path, right.curriculum_sort_path) || left.item_id - right.item_id;
}

function getDirectionalNextAt(item: UserItemLocal): string {
  const nextAt = item.review_direction === 'en_to_cz'
    ? item.next_at_en_to_cz ?? item.next_at_cz_to_en
    : item.next_at_cz_to_en;
  return nextAt === NULL_DATE ? RESET_SORT_DATE : nextAt;
}

function getDueCount(items: readonly PracticeDeckItem[], now: string): number {
  return items.filter((item) => isReviewItemReadyAt(item, now, item.review_direction)).length;
}

function getReviewReadyAt(items: readonly PracticeDeckItem[], deckSize: number, now: string): string | null {
  const dueCount = getDueCount(items, now);
  if (dueCount >= deckSize) return now;
  const futureItems = items
    .filter((item) => isReviewItemFuture(item, now, item.review_direction))
    .sort(compareReviewItems);
  const nextItem = futureItems[deckSize - dueCount - 1];
  return nextItem ? getDirectionalNextAt(nextItem) : null;
}

function getNextReviewAt(items: readonly PracticeDeckItem[], now: string): string | null {
  const next = items.filter((item) => isReviewItemFuture(item, now, item.review_direction)).sort(compareReviewItems)[0];
  return next ? getDirectionalNextAt(next) : null;
}

function earlierDate(left: string | null, right: string | null): string | null {
  if (left === null) return right;
  if (right === null) return left;
  return left < right ? left : right;
}

function countDue(
  first: readonly PracticeDeckItem[],
  second: readonly PracticeDeckItem[],
  now: string,
): number {
  return first.filter((item) => isReviewItemDue(item, now, item.review_direction)).length +
    second.filter((item) => isReviewItemDue(item, now, item.review_direction)).length;
}

function toPracticeEntry(item: PracticeDeckItem): PracticeDeckEntry {
  return { item, note: null, grammar: null };
}
