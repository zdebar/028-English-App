import config from '@/config/config';
import { db } from '@/database/models/db';
import GrammarChunk, {
  type GrammarChunkWithExamples,
} from '@/database/models/grammar-chunks';
import UserItem from '@/database/models/user-items';
import { reportError } from '@/features/logging/monitoring-handler';
import type { GrammarGroupType, NoteType } from '@/types/generic.types';
import type {
  PracticeDeckEntry,
  ResolvedPracticeEntry,
  UserItemLocal,
} from '@/types/user-item.types';

function uniquePositiveIds(values: Array<number | null | undefined>): number[] {
  return [
    ...new Set(
      values.filter(
        (value): value is number => typeof value === 'number' && value > 0,
      ),
    ),
  ];
}

async function loadNotes(noteIds: number[]): Promise<Map<number, NoteType>> {
  if (noteIds.length === 0) return new Map();

  try {
    const notes = await db.notes.bulkGet(noteIds);
    const noteById = new Map<number, NoteType>();
    notes.forEach((note, index) => {
      if (note) noteById.set(noteIds[index], note);
    });
    return noteById;
  } catch (error) {
    reportError('Failed to resolve practice notes', error, {
      noteIds: noteIds.join(','),
    });
    return new Map();
  }
}

async function loadGrammar(
  userId: string,
  grammarChunkIds: number[],
): Promise<Map<number, GrammarChunkWithExamples>> {
  if (grammarChunkIds.length === 0) return new Map();

  let chunks;
  try {
    chunks = await db.grammar_chunks.bulkGet(grammarChunkIds);
  } catch (error) {
    reportError('Failed to resolve practice grammar chunks', error, {
      grammarChunkIds: grammarChunkIds.join(','),
    });
    return new Map();
  }

  const resolvedChunks = await Promise.all(
    chunks.map(async (chunk, index) => {
      if (!chunk) return null;

      try {
        return await GrammarChunk.addExamples(userId, chunk);
      } catch (error) {
        const grammarChunkId = grammarChunkIds[index];
        reportError('Failed to resolve practice grammar examples', error, {
          grammarChunkId,
        });
        return null;
      }
    }),
  );
  const grammarById = new Map<number, GrammarChunkWithExamples>();
  resolvedChunks.forEach((grammar, index) => {
    if (grammar) grammarById.set(grammarChunkIds[index], grammar);
  });
  return grammarById;
}

export async function resolvePracticeEntries<T extends UserItemLocal>(
  userId: string,
  items: readonly T[],
): Promise<Array<ResolvedPracticeEntry<T>>> {
  const noteIds = uniquePositiveIds(items.map((item) => item.note_id));
  const grammarChunkIds = uniquePositiveIds(items.map((item) => item.grammar_chunk_id));
  const [noteById, grammarById] = await Promise.all([
    loadNotes(noteIds),
    loadGrammar(userId, grammarChunkIds),
  ]);

  return items.map((item) => ({
    item,
    note: item.note_id == null ? null : (noteById.get(item.note_id) ?? null),
    grammar:
      item.grammar_chunk_id <= 0
        ? null
        : (grammarById.get(item.grammar_chunk_id) ?? null),
  }));
}

export async function resolvePracticeGrammar(
  userId: string,
  grammarChunkId: number | null | undefined,
): Promise<GrammarChunkWithExamples | null> {
  if (typeof grammarChunkId !== 'number' || grammarChunkId <= 0) return null;
  const grammarById = await loadGrammar(userId, [grammarChunkId]);
  return grammarById.get(grammarChunkId) ?? null;
}

export type PracticeGrammarContext = Readonly<{
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GrammarGroupType | null;
}>;

export async function resolvePracticeGrammarContext(
  userId: string,
  grammarChunkId: number | null | undefined,
): Promise<PracticeGrammarContext> {
  const grammar = await resolvePracticeGrammar(userId, grammarChunkId);
  if (!grammar) return { grammar: null, grammarGroup: null };

  try {
    const grammarGroup = (await db.grammar_groups.get(grammar.grammar_group_id)) ?? null;
    return { grammar, grammarGroup };
  } catch (error) {
    reportError('Failed to resolve practice grammar group', error, {
      grammarGroupId: grammar.grammar_group_id,
    });
    return { grammar, grammarGroup: null };
  }
}

export async function loadReviewDeck(
  userId: string,
  deckSize: number = config.lesson.deckSize,
): Promise<PracticeDeckEntry[]> {
  const items = await UserItem.getReviewDeck(userId, deckSize);
  return resolvePracticeEntries(userId, items);
}

export async function loadPronunciationPracticeDeck(
  userId: string,
): Promise<Array<ResolvedPracticeEntry<UserItemLocal>>> {
  const items = await UserItem.getPronunciationPracticeDeck(userId);
  return resolvePracticeEntries(userId, items);
}
