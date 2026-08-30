import config from '@/config/config';
import Block from '@/database/models/blocks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import type { BlockType, GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
import type { NewPracticePhase, PracticeSessionType } from '@/types/practice-session.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import type { InitialTrainingData } from '@/routing/route-data';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import {
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';
import { getStarTierForCount, type StarTier } from '@/utils/star-progress.utils';
import { useStarCelebration } from './use-star-celebration';

const PHASE_DIRECTIONS: Record<NewPracticePhase, 'czToEn' | 'enToCz'> = {
  0: 'czToEn',
  1: 'enToCz',
};

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
  phase: NewPracticePhase;
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
  items: UserItemLocal[],
  itemById: Map<number, UserItemLocal>,
  resolvedEntries: Array<ResolvedPracticeEntry<UserItemLocal>>,
  celebratingStar: boolean,
  revealed: boolean,
): InitialTrainingView {
  const currentItemId = session?.current_queue_item_ids[0];
  const currentItem = getCurrentTrainingItem(currentItemId, itemById);
  const currentEntry = getCurrentTrainingEntry(currentItem, resolvedEntries);
  const phase = getTrainingPhase(session);
  const displayedCompletedCount = getDisplayedTrainingCount(celebratingStar, items, session);
  const pronunciation = getTrainingPronunciation(currentItem, revealed);
  return { currentItem, currentEntry, phase, displayedCompletedCount, pronunciation };
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

function getTrainingPhase(session: PracticeSessionType | null): NewPracticePhase {
  return session?.phase ?? 0;
}

function getDisplayedTrainingCount(
  celebratingStar: boolean,
  items: UserItemLocal[],
  session: PracticeSessionType | null,
): number {
  if (celebratingStar) return items.length;
  return session?.completed_count ?? 0;
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
  return UserItem.getNextInitialTrainingSelection(userId);
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
  return PracticeSession.startNew(
    userId,
    blockId,
    items.map((item) => item.item_id),
  );
}

function hasTrainingProgress(existing: PracticeSessionType | null): boolean {
  if (!existing) return false;
  return existing.phase !== 0 || existing.completed_item_ids.length > 0;
}

type InitialTrainingLoadSetters = Readonly<{
  setBlock: Dispatch<SetStateAction<BlockType | null>>;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
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
): () => void {
  let mounted = true;
  void loadInitialTrainingData(userId, initialData)
    .then((result) => {
      if (!mounted) return;
      if (!result) {
        setters.setItems([]);
        return;
      }
      setters.setBlock(result.block);
      setters.setItems(result.items);
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

function moveToNextTrainingPhase(
  currentSession: PracticeSessionType,
  items: UserItemLocal[],
): PracticeSessionType | null {
  const currentPhase = currentSession.phase ?? 0;
  if (currentPhase === 1) return null;
  return {
    ...currentSession,
    phase: (currentPhase + 1) as NewPracticePhase,
    completed_count: 0,
    current_queue_item_ids: items.map((item) => item.item_id),
    retry_queue_item_ids: [],
    completed_item_ids: [],
    updated_at: new Date(Date.now()).toISOString(),
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
  moveToNextPhase: (session: PracticeSessionType) => PracticeSessionType | null,
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
  return moveToNextPhase(nextSession);
}

function updateTrainingItem(items: UserItemLocal[], updatedItem: UserItemLocal): UserItemLocal[] {
  return items.map((item) => (item.item_id === updatedItem.item_id ? updatedItem : item));
}

type AdvanceInitialTrainingOptions = Readonly<{
  outcome: TrainingOutcome;
  session: PracticeSessionType | null;
  currentItem: UserItemLocal | null;
  phase: NewPracticePhase;
  celebratingStar: boolean;
  isComplete: boolean;
  moveToNextPhase: (session: PracticeSessionType) => PracticeSessionType | null;
  finishBlock: (item: UserItemLocal) => Promise<void>;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setSession: Dispatch<SetStateAction<PracticeSessionType | null>>;
  setHasProgress: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error | null>>;
  resetQuestionState: () => void;
}>;

async function advanceInitialTraining(options: AdvanceInitialTrainingOptions): Promise<void> {
  const {
    outcome,
    session,
    currentItem,
    phase,
    celebratingStar,
    isComplete,
    moveToNextPhase,
    finishBlock,
    setItems,
    setSession,
    setHasProgress,
    setError,
    resetQuestionState,
  } = options;
  if (!session || !currentItem || celebratingStar || isComplete) return;

  const dateTime = new Date(Date.now()).toISOString();
  const updatedItem = UserItem.applyPracticeProgress(
    currentItem,
    PHASE_DIRECTIONS[phase],
    outcome,
    dateTime,
    phase === 0 ? { oppositeDirectionNextAt: dateTime } : undefined,
  );

  try {
    const nextSession = resolveNextTrainingSession(
      session,
      currentItem.item_id,
      outcome,
      moveToNextPhase,
    );
    if (!nextSession) {
      await finishBlock(updatedItem);
      setItems((currentItems) => updateTrainingItem(currentItems, updatedItem));
      return;
    }

    await PracticeSession.recordInitialTrainingAnswer(updatedItem, nextSession);
    resetQuestionState();
    setItems((currentItems) => updateTrainingItem(currentItems, updatedItem));
    setSession(nextSession);
    setHasProgress(true);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setError(normalizedError);
    reportError('Failed to advance new-block training', normalizedError);
  }
}

export function useInitialTrainingDeck(userId: string | null, initialData?: InitialTrainingData) {
  const initialState = getInitialTrainingState(initialData);
  const [block, setBlock] = useState<BlockType | null>(initialState.block);
  const [items, setItems] = useState<UserItemLocal[]>(initialState.items);
  const [resolvedEntries, setResolvedEntries] = useState<
    Array<ResolvedPracticeEntry<UserItemLocal>>
  >(initialState.entries);
  const [grammar, setGrammar] = useState<GrammarDetail | null>(initialState.grammar);
  const [grammarGroup, setGrammarGroup] = useState<GrammarGroupType | null>(
    initialState.grammarGroup,
  );
  const [session, setSession] = useState<PracticeSessionType | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { celebratingStar, waitForAcknowledgement, acknowledgeCelebration, finishCelebration } =
    useStarCelebration();
  const [celebrationStarTier, setCelebrationStarTier] = useState<StarTier>('bronze');
  const [hasProgress, setHasProgress] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(userId != null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    return startInitialTrainingLoad(userId, initialData, {
      setBlock,
      setItems,
      setResolvedEntries,
      setGrammar,
      setGrammarGroup,
      setSession,
      setHasProgress,
      setLoading,
      setError,
    });
  }, [initialData, userId]);

  const itemById = useMemo(() => new Map(items.map((item) => [item.item_id, item])), [items]);
  const { currentItem, currentEntry, phase, displayedCompletedCount, pronunciation } = useMemo(
    () =>
      getInitialTrainingView(session, items, itemById, resolvedEntries, celebratingStar, revealed),
    [celebratingStar, itemById, items, resolvedEntries, revealed, session],
  );
  const isCzToEn = PHASE_DIRECTIONS[phase] === 'czToEn';
  const cardState = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });
  const resetQuestionState = cardState.resetQuestionState;

  const finishBlock = useCallback(
    async (finalItem: UserItemLocal) => {
      if (!userId || items.length === 0) return;
      const dateTime = new Date(Date.now()).toISOString();
      const starCount = await PracticeSession.completeInitialTraining(
        userId,
        items.map((item) => item.item_id),
        dateTime,
        finalItem,
      );
      invalidateRouteData(routeDataKey('initial-training', userId));
      invalidateRouteData(routeDataKey('practice', userId));
      setCelebrationStarTier(getStarTierForCount(starCount, config.practice.starsPerRow));
      await waitForAcknowledgement();
      finishCelebration();
      setIsComplete(true);
    },
    [finishCelebration, items, userId, waitForAcknowledgement],
  );

  const moveToNextPhase = useCallback(
    (currentSession: PracticeSessionType) => moveToNextTrainingPhase(currentSession, items),
    [items],
  );

  const advance = useCallback(
    async (outcome: TrainingOutcome) => {
      await advanceInitialTraining({
        outcome,
        session,
        currentItem,
        phase,
        celebratingStar,
        isComplete,
        moveToNextPhase,
        finishBlock,
        setItems,
        setSession,
        setHasProgress,
        setError,
        resetQuestionState,
      });
    },
    [
      celebratingStar,
      currentItem,
      finishBlock,
      isComplete,
      items,
      moveToNextPhase,
      phase,
      resetQuestionState,
      session,
    ],
  );

  const completeCurrent = useCallback(() => advance('skip'), [advance]);

  return {
    block,
    items,
    hasContent: items.length > 0,
    grammar,
    grammarGroup,
    isComplete,
    celebratingStar,
    celebrationStarTier,
    acknowledgeCelebration,
    hasProgress,
    loading,
    error,
    currentItem,
    note: currentEntry?.note ?? null,
    practiceGrammar: currentEntry?.grammar ?? null,
    progressLabel: `${phase + 1}/2 · ${displayedCompletedCount}/${items.length}`,
    isCzToEn,
    revealed,
    czech: cardState.czech,
    english: cardState.english,
    pronunciation,
    audioDisabled: cardState.audioDisabled,
    showDirectionChange: cardState.showDirectionChange,
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
