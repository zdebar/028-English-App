import { db } from '@/database/models/db';
import GrammarChunk, { type GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import type { LessonType, NoteType } from '@/types/generic.types';
import type { GroupType } from '@/types/table.types';
import type {
  PracticeDeckEntry,
  ResolvedPracticeEntry,
  UserItemLocal,
} from '@/types/user-item.types';
import type { ReviewDirection, ReviewKind } from '@/types/practice.types';
import { isReviewItemDue } from './review-items.utils';
import { getPrefetchedReviewItems } from '@/features/practice/review-prefetch';

function uniquePositiveIds(values: Array<number | null | undefined>): number[] {
  return [
    ...new Set(values.filter((value): value is number => typeof value === 'number' && value > 0)),
  ];
}

type DetailLoadResult<T> = Readonly<{
  data: Map<number, T>;
  failed: boolean;
}>;

async function loadNotes(noteIds: number[]): Promise<DetailLoadResult<NoteType>> {
  if (noteIds.length === 0) return { data: new Map(), failed: false };

  try {
    const notes = await db.notes.bulkGet(noteIds);
    const noteById = new Map<number, NoteType>();
    notes.forEach((note, index) => {
      if (note) noteById.set(noteIds[index], note);
    });
    return { data: noteById, failed: false };
  } catch (error) {
    reportError('Failed to resolve practice notes', error, {
      noteIds: noteIds.join(','),
    });
    return { data: new Map(), failed: true };
  }
}

async function loadGrammar(
  userId: string,
  grammarGroupIds: number[],
): Promise<DetailLoadResult<GrammarChunkWithExamples>> {
  if (grammarGroupIds.length === 0) return { data: new Map(), failed: false };

  let groups;
  try {
    groups = await db.groups.bulkGet(grammarGroupIds);
  } catch (error) {
    reportError('Failed to resolve practice grammar groups', error, {
      grammarGroupIds: grammarGroupIds.join(','),
    });
    return { data: new Map(), failed: true };
  }

  let failed = false;
  const resolved = await Promise.all(groups.map(async (group) => {
    if (group?.type !== 'grammar') return null;
    try {
      return await GrammarChunk.addExamples(userId, group);
    } catch (error) {
      failed = true;
      reportError('Failed to resolve practice grammar examples', error, { groupId: group.id });
      return null;
    }
  }));
  const grammarById = new Map<number, GrammarChunkWithExamples>();
  resolved.forEach((grammar) => {
    if (grammar) grammarById.set(grammar.id, grammar);
  });
  return { data: grammarById, failed };
}

export async function resolvePracticeEntries<T extends UserItemLocal>(
  userId: string,
  items: readonly T[],
): Promise<Array<ResolvedPracticeEntry<T>>> {
  const noteIds = uniquePositiveIds(items.map((item) => item.note_id));
  const lessonIds = [...new Set(items.map((item) => item.lesson_id))];
  const [notes, lessons] = await Promise.all([
    loadNotes(noteIds),
    db.lessons.where('id').anyOf(lessonIds).toArray(),
  ]);
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const grammarGroupIds = uniquePositiveIds(lessons
    .filter((lesson) => lesson.group_id != null)
    .map((lesson) => lesson.group_id));
  const grammar = await loadGrammar(userId, grammarGroupIds);

  return items.map((item) => ({
    item,
    note: item.note_id == null ? null : (notes.data.get(item.note_id) ?? null),
    grammar: getLessonGrammar(lessonById.get(item.lesson_id), grammar.data),
  }));
}

export async function resolvePracticeGrammar(
  userId: string,
  groupId: number | null | undefined,
): Promise<GrammarChunkWithExamples | null> {
  if (typeof groupId !== 'number' || groupId <= 0) return null;
  const grammar = await loadGrammar(userId, [groupId]);
  return grammar.data.get(groupId) ?? null;
}

export type PracticeGrammarContext = Readonly<{
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GroupType | null;
}>;

export async function resolvePracticeGrammarContext(
  userId: string,
  groupId: number | null | undefined,
): Promise<PracticeGrammarContext> {
  const grammar = await resolvePracticeGrammar(userId, groupId);
  if (!grammar) return { grammar: null, grammarGroup: null };

  try {
    const relation = await db.group_relations
      .where('child_group_id')
      .equals(grammar.id)
      .filter((candidate) => candidate.relation_type === 'detail' && !candidate.deleted_at)
      .first();
    const parent = relation ? await db.groups.get(relation.parent_group_id) : undefined;
    const grammarGroup = parent?.type === 'grammar' ? parent : null;
    return { grammar, grammarGroup };
  } catch (error) {
    reportError('Failed to resolve practice grammar group', error, {
      groupId: grammar.id,
    });
    return { grammar, grammarGroup: null };
  }
}

export async function loadReviewDeck(
  userId: string,
  reviewKind: ReviewKind,
  direction: ReviewDirection = 'cz_to_en',
): Promise<PracticeDeckEntry[]> {
  const items = await UserItem.getReviewDeck(userId, reviewKind, undefined, direction);
  return items.map((item) => ({ item: { ...item, review_direction: direction }, note: null, grammar: null }));
}

export type ReviewDeckData = Readonly<{
  entries: PracticeDeckEntry[];
  prefetchedEntries?: PracticeDeckEntry[];
  availabilityCheckedAt: string;
  abandoned: boolean;
  reviewKind: ReviewKind;
  reviewDirection: ReviewDirection;
  availableCount?: number;
}>;

/** Loads the next complete CZ-to-EN review batch without creating a review session. */
export async function loadReviewDeckData(
  userId: string,
  reviewKind: ReviewKind,
  reviewDirection?: ReviewDirection,
): Promise<ReviewDeckData> {
  const now = new Date().toISOString();
  const allowDirectionFallback = reviewDirection === undefined;
  let selectedDirection = reviewDirection ?? 'cz_to_en';
  try {
    let [prefetchedItems, otherDirectionItems] = await Promise.all([
      getPrefetchedReviewItems(userId, reviewKind, selectedDirection),
      getPrefetchedReviewItems(userId, reviewKind, getOtherReviewDirection(selectedDirection)),
    ]);
    let entries = prefetchedItems.filter((item) => isReviewItemDue(item, now, selectedDirection));
    if (entries.length === 0 && allowDirectionFallback && selectedDirection === 'cz_to_en') {
      selectedDirection = 'en_to_cz';
      [prefetchedItems, otherDirectionItems] = [otherDirectionItems, prefetchedItems];
      entries = prefetchedItems.filter((item) => isReviewItemDue(item, now, selectedDirection));
    }
    return {
      entries: entries.map(toPracticeDeckEntry),
      prefetchedEntries: prefetchedItems.map(toPracticeDeckEntry),
      availabilityCheckedAt: now,
      abandoned: entries.length === 0,
      reviewKind,
      reviewDirection: selectedDirection,
      availableCount: countDueItems(prefetchedItems, otherDirectionItems, now),
    };
  } catch {
    const [czToEnItems, enToCzItems] = await db.transaction('r', db.user_items, () => Promise.all([
      UserItem.getReviewDeck(userId, reviewKind, now, 'cz_to_en'),
      UserItem.getReviewDeck(userId, reviewKind, now, 'en_to_cz'),
    ]));
    let items = selectedDirection === 'cz_to_en' ? czToEnItems : enToCzItems;
    if (allowDirectionFallback && selectedDirection === 'cz_to_en' && czToEnItems.length === 0) {
      selectedDirection = 'en_to_cz';
      items = enToCzItems;
    }
    const entries = items.map((item) => toPracticeDeckEntry({ ...item, review_direction: selectedDirection }));
    return {
      entries,
      prefetchedEntries: entries,
      availabilityCheckedAt: now,
      abandoned: entries.length === 0,
      reviewKind,
      reviewDirection: selectedDirection,
      availableCount: czToEnItems.length + enToCzItems.length,
    };
  }
}

function getOtherReviewDirection(direction: ReviewDirection): ReviewDirection {
  return direction === 'cz_to_en' ? 'en_to_cz' : 'cz_to_en';
}

function countDueItems(
  first: readonly UserItemLocal[],
  second: readonly UserItemLocal[],
  now: string,
): number {
  return first.filter((item) => isReviewItemDue(item, now, item.review_direction)).length +
    second.filter((item) => isReviewItemDue(item, now, item.review_direction)).length;
}

function toPracticeDeckEntry(item: UserItemLocal): PracticeDeckEntry {
  return { item, note: null, grammar: null };
}

export type ReviewEntryDetails = Readonly<{
  note: PracticeDeckEntry['note'];
  grammar: PracticeDeckEntry['grammar'];
  noteLoadFailed: boolean;
  grammarLoadFailed: boolean;
}>;

/** Loads optional note and grammar content for one already-selected review card. */
export async function loadReviewEntryDetails(
  userId: string,
  item: UserItemLocal,
): Promise<ReviewEntryDetails> {
  const noteIds = uniquePositiveIds([item.note_id]);
  const [notes, lesson] = await Promise.all([
    loadNotes(noteIds),
    db.lessons.get(item.lesson_id),
  ]);
  const grammar = await loadGrammar(userId, uniquePositiveIds([lesson?.group_id]));
  return {
    note: item.note_id == null ? null : (notes.data.get(item.note_id) ?? null),
    grammar: getLessonGrammar(lesson, grammar.data),
    noteLoadFailed: notes.failed,
    grammarLoadFailed: grammar.failed,
  };
}

function getLessonGrammar(
  lesson: LessonType | undefined,
  grammarById: ReadonlyMap<number, GrammarChunkWithExamples>,
): GrammarChunkWithExamples | null {
  if (!lesson?.group_id) return null;
  return grammarById.get(lesson.group_id) ?? null;
}
