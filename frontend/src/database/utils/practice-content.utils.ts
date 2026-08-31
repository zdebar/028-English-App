import config from '@/config/config';
import { db } from '@/database/models/db';
import GrammarChunk, { type GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import type { PracticeSessionType, ReviewQueueEntry } from '@/types/practice-session.types';
import { reportError } from '@/features/logging/monitoring-handler';
import type { GrammarGroupType, NoteType } from '@/types/generic.types';
import type {
  PracticeDeckEntry,
  PracticeDeckItem,
  PracticeDirection,
  ResolvedPracticeEntry,
  UserItemLocal,
} from '@/types/user-item.types';

const NULL_DATE = config.database.nullReplacementDate;
const REVIEW_MINIMUM = config.practice.reviewMinimumSize;

function uniquePositiveIds(values: Array<number | null | undefined>): number[] {
  return [
    ...new Set(values.filter((value): value is number => typeof value === 'number' && value > 0)),
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
    grammar: item.grammar_chunk_id <= 0 ? null : (grammarById.get(item.grammar_chunk_id) ?? null),
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
  deckSize: number = config.practice.reviewMinimumSize,
): Promise<PracticeDeckEntry[]> {
  const items = await UserItem.getReviewDeck(userId, deckSize);
  return resolvePracticeEntries(userId, items);
}

export type ReviewSessionDeck = Readonly<{
  entries: PracticeDeckEntry[];
  session: PracticeSessionType | null;
  abandoned: boolean;
}>;

/** Loads the remaining cards from a persisted review queue. */
export async function loadReviewSessionDeck(userId: string): Promise<ReviewSessionDeck> {
  const storedSession = await PracticeSession.startReview(userId);
  if (storedSession.mode !== 'review') {
    throw new Error('Review practice requires an active review session.');
  }

  const session = normalizeReviewSession(storedSession);
  const reviewQueue = session.review_queue;
  if (reviewQueue && reviewQueue.length > 0) {
    return loadPersistedReviewQueue(userId, session, reviewQueue);
  }
  return initializeNextReviewDirection(userId, session);
}

async function loadPersistedReviewQueue(
  userId: string,
  session: PracticeSessionType,
  reviewQueue: ReviewQueueEntry[],
): Promise<ReviewSessionDeck> {
  const items = await UserItem.getByItemIds(
    userId,
    reviewQueue.map((entry) => entry.item_id),
  );
  const itemById = new Map(items.map((item) => [item.item_id, item]));
  const availableQueue: ReviewQueueEntry[] = [];
  const availableItems: PracticeDeckItem[] = [];

  for (const entry of reviewQueue) {
    const item = itemById.get(entry.item_id);
    if (item?.deleted_at !== NULL_DATE) continue;
    if (!item) continue;
    if (isDirectionMastered(item, entry.direction)) continue;

    availableQueue.push(entry);
    availableItems.push({ ...item, practice_direction: entry.direction });
  }

  if (availableQueue.length !== reviewQueue.length) {
    return initializeNextReviewDirection(userId, session);
  }

  const entries = await resolvePracticeEntries(userId, availableItems);
  return { entries, session, abandoned: false };
}

function normalizeReviewSession(session: PracticeSessionType): PracticeSessionType {
  if (session.review_direction && session.target_count > 0) return session;

  return {
    ...session,
    target_count: 0,
    completed_count: 0,
    review_queue: session.review_queue ?? [],
    updated_at: new Date(Date.now()).toISOString(),
  };
}

async function initializeNextReviewDirection(
  userId: string,
  session: PracticeSessionType,
): Promise<ReviewSessionDeck> {
  const directions = getReviewDirectionOrder(session.review_direction);
  for (const direction of directions) {
    const entries = await UserItem.getReviewDeckForDirection(userId, direction);
    if (entries.length < REVIEW_MINIMUM) continue;

    const resolvedEntries = await resolvePracticeEntries(userId, entries);
    const initializedSession = withReviewQueue(session, toReviewQueue(resolvedEntries), direction);
    await PracticeSession.put(initializedSession);
    return { entries: resolvedEntries, session: initializedSession, abandoned: false };
  }

  await PracticeSession.deleteByUserId(userId);
  return { entries: [], session: null, abandoned: true };
}

function toReviewQueue(entries: readonly PracticeDeckEntry[]): ReviewQueueEntry[] {
  return entries.map(({ item }) => ({
    item_id: item.item_id,
    direction: item.practice_direction,
  }));
}

function withReviewQueue(
  session: PracticeSessionType,
  reviewQueue: ReviewQueueEntry[],
  direction: PracticeDirection,
): PracticeSessionType {
  return {
    ...session,
    completed_count: 0,
    target_count: reviewQueue.length,
    review_queue: reviewQueue,
    review_direction: direction,
    updated_at: new Date(Date.now()).toISOString(),
  };
}

function getReviewDirectionOrder(previousDirection?: PracticeDirection): PracticeDirection[] {
  if (previousDirection === 'czToEn') return ['enToCz', 'czToEn'];
  if (previousDirection === 'enToCz') return ['czToEn', 'enToCz'];
  return ['czToEn', 'enToCz'];
}

function isDirectionMastered(item: UserItemLocal, direction: PracticeDirection): boolean {
  return direction === 'czToEn'
    ? item.mastered_at_cz_to_en !== NULL_DATE
    : item.mastered_at_en_to_cz !== NULL_DATE;
}

export async function loadPronunciationPracticeDeck(
  userId: string,
): Promise<Array<ResolvedPracticeEntry<UserItemLocal>>> {
  const items = await UserItem.getPronunciationPracticeDeck(userId);
  return resolvePracticeEntries(userId, items);
}
