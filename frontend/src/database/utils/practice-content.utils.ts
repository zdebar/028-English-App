import { db } from '@/database/models/db';
import GrammarChunk, { type GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import { reportError } from '@/features/logging/monitoring-handler';
import type { LessonType, NoteType } from '@/types/generic.types';
import type { GroupType } from '@/types/table.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';

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

async function resolvePracticeGrammar(
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

export type ReviewEntryDetails = Readonly<{
  note: NoteType | null;
  grammar: GrammarChunkWithExamples | null;
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
