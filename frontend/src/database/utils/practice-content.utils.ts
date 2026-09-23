import { db } from '@/database/models/db';
import GrammarChunk, { type GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import PracticeSession from '@/database/models/practice-sessions';
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
  grammarChunkIds: number[],
): Promise<DetailLoadResult<GrammarChunkWithExamples>> {
  if (grammarChunkIds.length === 0) return { data: new Map(), failed: false };

  let chunks;
  try {
    chunks = await db.grammar_chunks.bulkGet(grammarChunkIds);
  } catch (error) {
    reportError('Failed to resolve practice grammar chunks', error, {
      grammarChunkIds: grammarChunkIds.join(','),
    });
    return { data: new Map(), failed: true };
  }

  let failed = false;
  const resolvedChunks = await Promise.all(
    chunks.map(async (chunk, index) => {
      if (!chunk) return null;

      try {
        return await GrammarChunk.addExamples(userId, chunk);
      } catch (error) {
        failed = true;
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
  return { data: grammarById, failed };
}

export async function resolvePracticeEntries<T extends UserItemLocal>(
  userId: string,
  items: readonly T[],
): Promise<Array<ResolvedPracticeEntry<T>>> {
  const noteIds = uniquePositiveIds(items.map((item) => item.note_id));
  const grammarChunkIds = uniquePositiveIds(items.map((item) => item.grammar_chunk_id));
  const [notes, grammar] = await Promise.all([
    loadNotes(noteIds),
    loadGrammar(userId, grammarChunkIds),
  ]);

  return items.map((item) => ({
    item,
    note: item.note_id == null ? null : (notes.data.get(item.note_id) ?? null),
    grammar: item.grammar_chunk_id <= 0 ? null : (grammar.data.get(item.grammar_chunk_id) ?? null),
  }));
}

export async function resolvePracticeGrammar(
  userId: string,
  grammarChunkId: number | null | undefined,
): Promise<GrammarChunkWithExamples | null> {
  if (typeof grammarChunkId !== 'number' || grammarChunkId <= 0) return null;
  const grammar = await loadGrammar(userId, [grammarChunkId]);
  return grammar.data.get(grammarChunkId) ?? null;
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
): Promise<PracticeDeckEntry[]> {
  const items = await UserItem.getReviewDeck(userId);
  return items.map((item) => ({ item, note: null, grammar: null }));
}

export type ReviewDeckData = Readonly<{
  entries: PracticeDeckEntry[];
  availabilityCheckedAt: string;
  abandoned: boolean;
}>;

/** Loads the next complete CZ-to-EN review batch without creating a review session. */
export async function loadReviewDeckData(userId: string): Promise<ReviewDeckData> {
  const activeSession = await PracticeSession.reconcileActive(userId);
  if (activeSession?.mode === 'new') {
    throw new Error('Review practice is unavailable during initial block practice.');
  }

  const now = new Date().toISOString();
  const items = await db.transaction('r', db.user_items, () =>
    UserItem.getReviewDeck(userId, now),
  );
  const entries = items.map((item) => ({ item, note: null, grammar: null }));
  return { entries, availabilityCheckedAt: now, abandoned: entries.length === 0 };
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
  const grammarChunkIds = uniquePositiveIds([item.grammar_chunk_id]);
  const [notes, grammar] = await Promise.all([
    loadNotes(noteIds),
    loadGrammar(userId, grammarChunkIds),
  ]);
  return {
    note: item.note_id == null ? null : (notes.data.get(item.note_id) ?? null),
    grammar: item.grammar_chunk_id <= 0 ? null : (grammar.data.get(item.grammar_chunk_id) ?? null),
    noteLoadFailed: notes.failed,
    grammarLoadFailed: grammar.failed,
  };
}
