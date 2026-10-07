import Block from '@/database/models/blocks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import config from '@/config/config';
import {
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';
import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { BlockType, GrammarGroupType } from '@/types/generic.types';
import type { PracticeSessionType } from '@/types/practice-session.types';
import type {
  ResolvedPracticeEntry,
  UserItemLocal,
} from '@/types/user-item.types';
import {
  clearReviewArrays,
  invalidateReviewArrays,
  warmReviewArrays,
} from './review-prefetch';

export type PreparedInitialBlock = Readonly<{
  block: BlockType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GrammarGroupType | null;
}>;

type PracticePrefetchState = {
  nextInitialBlock: PreparedInitialBlock | null;
  dirty: boolean;
  version: number;
  pending: Promise<void> | null;
};

const states = new Map<string, PracticePrefetchState>();

function createState(): PracticePrefetchState {
  return {
    nextInitialBlock: null,
    dirty: true,
    version: 0,
    pending: null,
  };
}

function getState(userId: string): PracticePrefetchState {
  let state = states.get(userId);
  if (!state) {
    state = createState();
    states.set(userId, state);
  }
  return state;
}

function getSavedSessionItemIds(session: PracticeSessionType | null): number[] {
  if (!session) return [];
  return [
    ...session.current_queue_item_ids,
    ...session.retry_queue_item_ids,
    ...session.completed_item_ids,
  ];
}

function getSelectionOptions(session: PracticeSessionType | null) {
  if (!session) return {};
  const options = {
    excludeItemIds: getSavedSessionItemIds(session),
  };
  if (session.block_id === null) return options;
  return { ...options, excludeBlockId: session.block_id };
}

async function loadPreparedInitialBlock(
  userId: string,
  activeSession: PracticeSessionType | null,
): Promise<PreparedInitialBlock | null> {
  const selection = await UserItem.getNextInitialTrainingSelection(
    userId,
    config.practice.initialTrainingBatchSize,
    getSelectionOptions(activeSession),
  );
  if (!selection || selection.items.length === 0) return null;

  const block = selection.blockId == null ? null : await Block.getById(selection.blockId);
  if (selection.blockId != null && !block) return null;

  const [entries, grammarContext] = await Promise.all([
    resolvePracticeEntries(userId, selection.items),
    resolvePracticeGrammarContext(userId, block?.grammar_chunk_id ?? null),
  ]);
  return {
    block,
    items: selection.items,
    entries,
    grammar: grammarContext.grammar,
    grammarGroup: grammarContext.grammarGroup,
  };
}

async function resolveActiveSession(
  userId: string,
  activeSession: PracticeSessionType | null | undefined,
): Promise<PracticeSessionType | null> {
  if (activeSession !== undefined) return activeSession;
  return (await PracticeSession.inspectActive(userId)).activeSession;
}

/** Loads review arrays and prepares the next initial block until explicit invalidation. */
export async function warmPracticeCache(
  userId: string,
  activeSession?: PracticeSessionType | null,
): Promise<void> {
  const state = getState(userId);
  if (state.pending) {
    await state.pending;
    return warmPracticeCache(userId, activeSession);
  }
  if (!state.dirty) return;

  const version = state.version;
  let pending: Promise<void>;
  pending = (async () => {
    const resolvedSession = await resolveActiveSession(userId, activeSession);
    const [, nextInitialBlock] = await Promise.all([
      warmReviewArrays(userId),
      loadPreparedInitialBlock(userId, resolvedSession),
    ]);
    if (states.get(userId) !== state || state.version !== version) return;
    state.nextInitialBlock = nextInitialBlock;
    state.dirty = false;
  })().finally(() => {
    if (state.pending === pending) state.pending = null;
  });

  state.pending = pending;
  await pending;
  if (states.get(userId) === state && state.version !== version) {
    return warmPracticeCache(userId, activeSession);
  }
}

export async function getPrefetchedNextInitialBlock(
  userId: string,
  activeSession?: PracticeSessionType | null,
): Promise<PreparedInitialBlock | null> {
  await warmPracticeCache(userId, activeSession);
  return getState(userId).nextInitialBlock;
}

export function invalidateNextInitialBlock(userId: string): void {
  const state = states.get(userId);
  if (!state) return;
  state.version += 1;
  state.dirty = true;
}

export function invalidatePracticeCache(userId: string): void {
  invalidateReviewArrays(userId);
  invalidateNextInitialBlock(userId);
}

export function clearPracticeCache(userId: string | null): void {
  clearReviewArrays(userId);
  if (userId) states.delete(userId);
  else states.clear();
}
