import { usePracticeAvailabilityBoundary } from './use-practice-availability-boundary';
import Block from '@/database/models/blocks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import type { BlockType, GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
import type { PracticeSessionType } from '@/types/practice-session.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import type { InitialTrainingData } from '@/routing/route-data';
import {
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';
import {
  invalidateReviewArrays,
  rebuildReviewArrays,
  syncReviewItemToCache,
} from '../review-prefetch';
import {
  getPrefetchedNextInitialBlock,
  invalidateNextInitialBlock,
  warmPracticeCache,
} from '../practice-prefetch';

type TrainingOutcome = 'correct' | 'incorrect' | 'skip';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function toGrammarDetail(grammar: GrammarChunkType | null | undefined): GrammarDetail | null {
  if (!grammar) return null;
  return { ...grammar, kind: 'chunk' };
}

type InitialTrainingLoadResult = Readonly<{
  block: BlockType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkType | null;
  grammarGroup: GrammarGroupType | null;
  session: PracticeSessionType;
  hasProgress: boolean;
}>;

type InitialTrainingView = Readonly<{
  currentItem: UserItemLocal | null;
  currentEntry: ResolvedPracticeEntry<UserItemLocal> | null;
  displayedCompletedCount: number;
  pronunciation: string;
}>;

function getInitialTrainingState(initialData: InitialTrainingData | undefined) {
  return {
    block: initialData?.block ?? null,
    items: initialData?.items ?? [],
    entries: initialData?.entries ?? [],
    grammar: toGrammarDetail(initialData?.grammar),
    grammarGroup: initialData?.grammarGroup ?? null,
  };
}

function getInitialTrainingView(
  session: PracticeSessionType | null,
  itemById: Map<number, UserItemLocal>,
  resolvedEntries: Array<ResolvedPracticeEntry<UserItemLocal>>,
  isComplete: boolean,
  revealed: boolean,
  initialItemCount: number,
): InitialTrainingView {
  const currentItemId = session?.current_queue_item_ids[0];
  const currentItem = getCurrentTrainingItem(currentItemId, itemById);
  const currentEntry = getCurrentTrainingEntry(currentItem, resolvedEntries);
  const displayedCompletedCount = getDisplayedTrainingCount(isComplete, initialItemCount, session);
  const pronunciation = getTrainingPronunciation(currentItem, revealed);
  return { currentItem, currentEntry, displayedCompletedCount, pronunciation };
}

function getCurrentTrainingItem(
  itemId: number | undefined,
  itemById: Map<number, UserItemLocal>,
): UserItemLocal | null {
  if (itemId == null) return null;
  return itemById.get(itemId) ?? null;
}

function getCurrentTrainingEntry(
  currentItem: UserItemLocal | null,
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>,
): ResolvedPracticeEntry<UserItemLocal> | null {
  return entries.find((entry) => entry.item.item_id === currentItem?.item_id) ?? null;
}

function getDisplayedTrainingCount(
  isComplete: boolean,
  initialItemCount: number,
  session: PracticeSessionType | null,
): number {
  if (isComplete) return initialItemCount;
  return session?.completed_count ?? 0;
}

function getActiveTrainingItems(
  items: UserItemLocal[],
  session: PracticeSessionType | null,
): UserItemLocal[] {
  if (!session) return [];

  const itemById = new Map(items.map((item) => [item.item_id, item]));
  const activeItemIds = [
    ...session.current_queue_item_ids,
    ...session.retry_queue_item_ids,
  ];
  return activeItemIds
    .map((itemId) => itemById.get(itemId))
    .filter((item): item is UserItemLocal => item !== undefined);
}

function getTrainingPronunciation(currentItem: UserItemLocal | null, revealed: boolean): string {
  if (!revealed) return NBSP;
  return currentItem?.pronunciation || NBSP;
}

async function resolveTrainingSelection(
  userId: string,
  initialData: InitialTrainingData | undefined,
) {
  if (initialData) {
    return { blockId: initialData.block?.id ?? null, items: initialData.items };
  }
  const preparedBlock = await getPrefetchedNextInitialBlock(userId, null);
  if (!preparedBlock) return null;
  return { blockId: preparedBlock.block?.id ?? null, items: preparedBlock.items };
}

async function resolveTrainingBlock(
  initialData: InitialTrainingData | undefined,
  selection: Awaited<ReturnType<typeof resolveTrainingSelection>>,
): Promise<BlockType | null> {
  if (initialData?.block) return initialData.block;
  if (selection?.blockId == null) return null;
  return Block.getById(selection.blockId);
}

async function resolveTrainingGrammarContext(
  userId: string,
  initialData: InitialTrainingData | undefined,
  block: BlockType | null,
) {
  if (initialData) {
    return { grammar: initialData.grammar, grammarGroup: initialData.grammarGroup };
  }
  return resolvePracticeGrammarContext(userId, block?.grammar_chunk_id);
}

function validateTrainingSession(
  session: PracticeSessionType | null,
  blockId: number | null,
): void {
  if (session && (session.mode !== 'new' || session.block_id !== blockId)) {
    throw new Error('Another practice session is already active.');
  }
}

async function loadInitialTrainingData(
  userId: string,
  initialData: InitialTrainingData | undefined,
): Promise<InitialTrainingLoadResult | null> {
  const selection = await resolveTrainingSelection(userId, initialData);
  const block = await resolveTrainingBlock(initialData, selection);
  const items = getTrainingItems(selection);
  if (items.length === 0) return null;

  const entries = await resolveTrainingEntries(userId, initialData, items);
  const grammarContext = await resolveTrainingGrammarContext(userId, initialData, block);
  const existing = await PracticeSession.reconcileActive(userId);
  const selectedBlockId = getTrainingBlockId(block);
  validateTrainingSession(existing, selectedBlockId);
  const session = await getTrainingSession(existing, userId, selectedBlockId, items);

  return {
    block,
    items,
    entries,
    grammar: grammarContext.grammar,
    grammarGroup: grammarContext.grammarGroup,
    session,
    hasProgress: hasTrainingProgress(existing),
  };
}

function getTrainingItems(
  selection: Awaited<ReturnType<typeof resolveTrainingSelection>>,
): UserItemLocal[] {
  return selection?.items ?? [];
}

async function resolveTrainingEntries(
  userId: string,
  initialData: InitialTrainingData | undefined,
  items: UserItemLocal[],
): Promise<Array<ResolvedPracticeEntry<UserItemLocal>>> {
  if (initialData?.entries) return initialData.entries;
  return resolvePracticeEntries(userId, items);
}

function getTrainingBlockId(block: BlockType | null): number | null {
  return block?.id ?? null;
}

async function getTrainingSession(
  existing: PracticeSessionType | null,
  userId: string,
  blockId: number | null,
  items: UserItemLocal[],
): Promise<PracticeSessionType> {
  if (existing) return existing;
  const session = await PracticeSession.startNew(
    userId,
    blockId,
    items.map((item) => item.item_id),
  );
  invalidateNextInitialBlock(userId);
  void warmPracticeCache(userId, session).catch((error: unknown) => {
    reportError('Failed to prefetch next initial block', error);
  });
  return session;
}

function hasTrainingProgress(existing: PracticeSessionType | null): boolean {
  if (!existing) return false;
  return existing.phase !== 0 || existing.completed_item_ids.length > 0;
}

type InitialTrainingLoadSetters = Readonly<{
  setBlock: Dispatch<SetStateAction<BlockType | null>>;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setActiveItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setInitialItemCount: Dispatch<SetStateAction<number>>;
  setResolvedEntries: Dispatch<SetStateAction<Array<ResolvedPracticeEntry<UserItemLocal>>>>;
  setGrammar: Dispatch<SetStateAction<GrammarDetail | null>>;
  setGrammarGroup: Dispatch<SetStateAction<GrammarGroupType | null>>;
  setSession: Dispatch<SetStateAction<PracticeSessionType | null>>;
  setHasProgress: Dispatch<SetStateAction<boolean>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error | null>>;
}>;

function startInitialTrainingLoad(
  userId: string,
  initialData: InitialTrainingData | undefined,
  setters: InitialTrainingLoadSetters,
  trackPracticeWrite: <T>(operation: Promise<T>) => Promise<T>,
): () => void {
  let mounted = true;
  void trackPracticeWrite(loadInitialTrainingData(userId, initialData))
    .then((result) => {
      if (!mounted) return;
      if (!result) {
        setters.setItems([]);
        setters.setActiveItems([]);
        setters.setInitialItemCount(0);
        return;
      }
      setters.setBlock(result.block);
      setters.setItems(result.items);
      setters.setActiveItems(getActiveTrainingItems(result.items, result.session));
      setters.setInitialItemCount(result.items.length);
      setters.setResolvedEntries(result.entries);
      setters.setGrammar(toGrammarDetail(result.grammar));
      setters.setGrammarGroup(result.grammarGroup);
      setters.setSession(result.session);
      setters.setHasProgress(result.hasProgress);
    })
    .catch((caughtError) => {
      if (mounted) setters.setError(toError(caughtError));
    })
    .finally(() => {
      if (mounted) setters.setLoading(false);
    });

  return () => {
    mounted = false;
  };
}

function getTrainingAnswerSession(
  session: PracticeSessionType,
  itemId: number,
  outcome: TrainingOutcome,
): PracticeSessionType {
  const shouldRepeat = outcome === 'incorrect';
  const remaining = session.current_queue_item_ids.slice(1);
  const retryIds = shouldRepeat
    ? [...session.retry_queue_item_ids, itemId]
    : session.retry_queue_item_ids;
  const completedIds = shouldRepeat
    ? session.completed_item_ids
    : [...session.completed_item_ids, itemId];
  return {
    ...session,
    completed_count: completedIds.length,
    current_queue_item_ids: remaining,
    retry_queue_item_ids: retryIds,
    completed_item_ids: completedIds,
    updated_at: new Date(Date.now()).toISOString(),
  };
}

function resolveNextTrainingSession(
  session: PracticeSessionType,
  itemId: number,
  outcome: TrainingOutcome,
): PracticeSessionType | null {
  const nextSession = getTrainingAnswerSession(session, itemId, outcome);
  if (nextSession.current_queue_item_ids.length !== 0) return nextSession;
  if (nextSession.retry_queue_item_ids.length > 0) {
    return {
      ...nextSession,
      current_queue_item_ids: nextSession.retry_queue_item_ids,
      retry_queue_item_ids: [],
    };
  }
  return null;
}

function updateTrainingItem(items: UserItemLocal[], updatedItem: UserItemLocal): UserItemLocal[] {
  return items.map((item) => (item.item_id === updatedItem.item_id ? updatedItem : item));
}

async function syncPersistedItemToReviewCache(item: UserItemLocal): Promise<void> {
  try {
    await syncReviewItemToCache(item.user_id, item);
  } catch (caughtError) {
    invalidateReviewArrays(item.user_id);
    void rebuildReviewArrays(item.user_id).catch((rebuildError: unknown) => {
      reportError('Failed to rebuild review arrays', rebuildError);
    });
    reportError('Failed to update review cache', caughtError);
  }
}

type AdvanceInitialTrainingOptions = Readonly<{
  outcome: TrainingOutcome;
  session: PracticeSessionType | null;
  currentItem: UserItemLocal | null;
  isComplete: boolean;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setActiveItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setSession: Dispatch<SetStateAction<PracticeSessionType | null>>;
  setHasProgress: Dispatch<SetStateAction<boolean>>;
  setIsComplete: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error | null>>;
  resetQuestionState: () => void;
}>;

async function advanceInitialTraining(options: AdvanceInitialTrainingOptions): Promise<void> {
  const {
    outcome,
    session,
    currentItem,
    isComplete,
    setItems,
    setActiveItems,
    setSession,
    setHasProgress,
    setIsComplete,
    setError,
    resetQuestionState,
  } = options;
  if (!session || !currentItem || isComplete) return;

  const dateTime = new Date(Date.now()).toISOString();
  const progressOptions = { initialTraining: true };
  const updatedItem = UserItem.applyPracticeProgress(
    currentItem,
    outcome,
    dateTime,
    progressOptions,
  );

  try {
    const nextSession = resolveNextTrainingSession(
      session,
      currentItem.item_id,
      outcome,
    );
    if (nextSession) {
      await PracticeSession.recordInitialTrainingAnswer(updatedItem, nextSession);
    } else {
      await PracticeSession.recordInitialTrainingAnswer(updatedItem, null, session);
    }
    await syncPersistedItemToReviewCache(updatedItem);
    invalidateNextInitialBlock(updatedItem.user_id);

    if (!nextSession) {
      setHasProgress(true);
      setIsComplete(true);
      setError(null);
      return;
    }

    resetQuestionState();
    setItems((currentItems) => updateTrainingItem(currentItems, updatedItem));
    setActiveItems((currentItems) =>
      getActiveTrainingItems(updateTrainingItem(currentItems, updatedItem), nextSession),
    );
    setSession(nextSession);
    setHasProgress(true);
    setError(null);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setError(normalizedError);
    reportError('Failed to advance new-block training', normalizedError);
  }
}

export function useInitialTrainingDeck(userId: string | null, initialData?: InitialTrainingData) {
  const { trackPracticeWrite, finishPractice } = usePracticeAvailabilityBoundary(userId);
  const initialState = getInitialTrainingState(initialData);
  const [block, setBlock] = useState<BlockType | null>(initialState.block);
  const [items, setItems] = useState<UserItemLocal[]>(initialState.items);
  const [activeItems, setActiveItems] = useState<UserItemLocal[]>(initialState.items);
  const [initialItemCount, setInitialItemCount] = useState(initialState.items.length);
  const [resolvedEntries, setResolvedEntries] = useState<
    Array<ResolvedPracticeEntry<UserItemLocal>>
  >(initialState.entries);
  const [grammar, setGrammar] = useState<GrammarDetail | null>(initialState.grammar);
  const [grammarGroup, setGrammarGroup] = useState<GrammarGroupType | null>(
    initialState.grammarGroup,
  );
  const [session, setSession] = useState<PracticeSessionType | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(userId != null);
  const [error, setError] = useState<Error | null>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    return startInitialTrainingLoad(userId, initialData, {
      setBlock,
      setItems,
      setActiveItems,
      setInitialItemCount,
      setResolvedEntries,
      setGrammar,
      setGrammarGroup,
      setSession,
      setHasProgress,
      setLoading,
      setError,
    }, trackPracticeWrite);
  }, [initialData, userId, trackPracticeWrite]);

  const itemById = useMemo(
    () => new Map(activeItems.map((item) => [item.item_id, item])),
    [activeItems],
  );
  const { currentItem, currentEntry, displayedCompletedCount, pronunciation } = useMemo(
    () =>
      getInitialTrainingView(
        session,
        itemById,
        resolvedEntries,
        isComplete,
        revealed,
        initialItemCount,
      ),
    [activeItems, initialItemCount, isComplete, itemById, resolvedEntries, revealed, session],
  );
  const cardState = usePracticeCardState({
    currentItem,
    revealed,
    isCompletion: isComplete,
    setRevealed,
  });
  const resetQuestionState = cardState.resetQuestionState;

  useEffect(() => {
    if (!isComplete) return;
    void finishPractice();
  }, [finishPractice, isComplete]);

  const advance = useCallback(
    async (outcome: TrainingOutcome) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      try {
        await trackPracticeWrite(
          advanceInitialTraining({
            outcome,
            session,
            currentItem,
            isComplete,
            setItems,
            setActiveItems,
            setSession,
            setHasProgress,
            setIsComplete,
            setError,
            resetQuestionState,
          }),
        );
      } finally {
        isTransitioningRef.current = false;
      }
    },
    [
      currentItem,
      isComplete,
      resetQuestionState,
      session,
      trackPracticeWrite,
    ],
  );

  const completeCurrent = useCallback(() => advance('skip'), [advance]);

  return {
    block,
    items,
    hasContent: initialItemCount > 0,
    grammar,
    grammarGroup,
    isComplete,
    isCompletion: isComplete,
    hasProgress,
    loading,
    error,
    finishPractice,
    currentItem,
    note: currentEntry?.note ?? null,
    practiceGrammar: currentEntry?.grammar ?? null,
    progressLabel: `${displayedCompletedCount}/${initialItemCount}`,
    revealed,
    czech: cardState.czech,
    english: cardState.english,
    pronunciation,
    audioDisabled: cardState.audioDisabled,
    handleReveal: cardState.handleReveal,
    plusHint: cardState.plusHint,
    nextRepeat: () => advance('incorrect'),
    nextKnown: () => advance('correct'),
    completeCurrent,
    audioError: cardState.audioError,
    playAudio: cardState.playAudio,
    audioLoading: cardState.audioLoading,
    isPlaying: cardState.isPlaying,
  };
}
