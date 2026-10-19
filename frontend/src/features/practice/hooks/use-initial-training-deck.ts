import { usePracticeAvailabilityBoundary } from './use-practice-availability-boundary';
import Lessons from '@/database/models/lessons';
import UserItem from '@/database/models/user-items';
import UserLesson from '@/database/models/user-lessons';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import type { LessonType, GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
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
  getPrefetchedNextInitialLesson,
  invalidateNextInitialLesson,
} from '../practice-prefetch';

type TrainingOutcome = 'correct' | 'incorrect' | 'skip';

type PracticeCompletionHandler = () => void;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function toGrammarDetail(grammar: GrammarChunkType | null | undefined): GrammarDetail | null {
  if (!grammar) return null;
  return { ...grammar, kind: 'chunk' };
}

type InitialTrainingLoadResult = Readonly<{
  lesson: LessonType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkType | null;
  grammarGroup: GrammarGroupType | null;
  queue: InitialTrainingQueue;
}>;

type InitialTrainingQueue = Readonly<{
  currentItemIds: number[];
  retryItemIds: number[];
  completedCount: number;
}>;

type InitialTrainingView = Readonly<{
  currentItem: UserItemLocal | null;
  currentEntry: ResolvedPracticeEntry<UserItemLocal> | null;
  displayedCompletedCount: number;
  pronunciation: string;
}>;

function getInitialTrainingState(initialData: InitialTrainingData | undefined) {
  return {
    lesson: initialData?.lesson ?? null,
    items: initialData?.items ?? [],
    entries: initialData?.entries ?? [],
    grammar: toGrammarDetail(initialData?.grammar),
    grammarGroup: initialData?.grammarGroup ?? null,
  };
}

function getInitialTrainingView(
  queue: InitialTrainingQueue | null,
  itemById: Map<number, UserItemLocal>,
  resolvedEntries: Array<ResolvedPracticeEntry<UserItemLocal>>,
  isComplete: boolean,
  revealed: boolean,
  initialItemCount: number,
): InitialTrainingView {
  const currentItemId = queue?.currentItemIds[0];
  const currentItem = getCurrentTrainingItem(currentItemId, itemById);
  const currentEntry = getCurrentTrainingEntry(currentItem, resolvedEntries);
  const displayedCompletedCount = isComplete ? initialItemCount : (queue?.completedCount ?? 0);
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

function getActiveTrainingItems(
  items: UserItemLocal[],
  queue: InitialTrainingQueue | null,
): UserItemLocal[] {
  if (!queue) return [];

  const itemById = new Map(items.map((item) => [item.item_id, item]));
  const activeItemIds = [...queue.currentItemIds, ...queue.retryItemIds];
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
    return { lessonId: initialData.lesson?.id ?? null, items: initialData.items };
  }
  const preparedLesson = await getPrefetchedNextInitialLesson(userId);
  if (!preparedLesson) return null;
  return { lessonId: preparedLesson.lesson?.id ?? null, items: preparedLesson.items };
}

function resolveTrainingLesson(
  initialData: InitialTrainingData | undefined,
  selection: Awaited<ReturnType<typeof resolveTrainingSelection>>,
): Promise<LessonType | null> {
  if (initialData?.lesson) return Promise.resolve(initialData.lesson);
  if (selection?.lessonId == null) return Promise.resolve(null);
  return Lessons.getById(selection.lessonId);
}

function resolveTrainingGrammarContext(
  userId: string,
  initialData: InitialTrainingData | undefined,
  lesson: LessonType | null,
): ReturnType<typeof resolvePracticeGrammarContext> {
  if (initialData) {
    return Promise.resolve({ grammar: initialData.grammar, grammarGroup: initialData.grammarGroup });
  }
  return resolvePracticeGrammarContext(userId, lesson?.grammar_chunk_id);
}

async function loadInitialTrainingData(
  userId: string,
  initialData: InitialTrainingData | undefined,
): Promise<InitialTrainingLoadResult | null> {
  const selection = await resolveTrainingSelection(userId, initialData);
  const lesson = await resolveTrainingLesson(initialData, selection);
  const items = getTrainingItems(selection);
  if (items.length === 0 || !lesson) return null;

  const entries = await resolveTrainingEntries(userId, initialData, items);
  const grammarContext = await resolveTrainingGrammarContext(userId, initialData, lesson);
  const didStart = await UserLesson.startIfAllowed(
    userId,
    lesson.id,
    items.map((item) => item.item_id),
  );
  if (!didStart) return null;
  invalidateNextInitialLesson(userId);

  return {
    lesson,
    items,
    entries,
    grammar: grammarContext.grammar,
    grammarGroup: grammarContext.grammarGroup,
    queue: {
      currentItemIds: items.map((item) => item.item_id),
      retryItemIds: [],
      completedCount: 0,
    },
  };
}

function getTrainingItems(
  selection: Awaited<ReturnType<typeof resolveTrainingSelection>>,
): UserItemLocal[] {
  return selection?.items ?? [];
}

function resolveTrainingEntries(
  userId: string,
  initialData: InitialTrainingData | undefined,
  items: UserItemLocal[],
): Promise<Array<ResolvedPracticeEntry<UserItemLocal>>> {
  if (initialData?.entries) return Promise.resolve(initialData.entries);
  return resolvePracticeEntries(userId, items);
}

type InitialTrainingLoadSetters = Readonly<{
  setLesson: Dispatch<SetStateAction<LessonType | null>>;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setActiveItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setInitialItemCount: Dispatch<SetStateAction<number>>;
  setResolvedEntries: Dispatch<SetStateAction<Array<ResolvedPracticeEntry<UserItemLocal>>>>;
  setGrammar: Dispatch<SetStateAction<GrammarDetail | null>>;
  setGrammarGroup: Dispatch<SetStateAction<GrammarGroupType | null>>;
  setQueue: Dispatch<SetStateAction<InitialTrainingQueue | null>>;
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
        setters.setLesson(null);
        setters.setItems([]);
        setters.setActiveItems([]);
        setters.setInitialItemCount(0);
        setters.setResolvedEntries([]);
        setters.setGrammar(null);
        setters.setGrammarGroup(null);
        setters.setQueue(null);
        setters.setHasProgress(false);
        return;
      }
      setters.setLesson(result.lesson);
      setters.setItems(result.items);
      setters.setActiveItems(getActiveTrainingItems(result.items, result.queue));
      setters.setInitialItemCount(result.items.length);
      setters.setResolvedEntries(result.entries);
      setters.setGrammar(toGrammarDetail(result.grammar));
      setters.setGrammarGroup(result.grammarGroup);
      setters.setQueue(result.queue);
      setters.setHasProgress(false);
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

function getTrainingAnswerQueue(
  queue: InitialTrainingQueue,
  itemId: number,
  outcome: TrainingOutcome,
): InitialTrainingQueue | null {
  const shouldRepeat = outcome === 'incorrect';
  const remaining = queue.currentItemIds.slice(1);
  const retryIds = shouldRepeat
    ? [...queue.retryItemIds, itemId]
    : queue.retryItemIds;
  const completedCount = queue.completedCount + (shouldRepeat ? 0 : 1);
  if (remaining.length > 0) {
    return { currentItemIds: remaining, retryItemIds: retryIds, completedCount };
  }
  if (retryIds.length > 0) {
    return {
      currentItemIds: retryIds,
      retryItemIds: [],
      completedCount,
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
  queue: InitialTrainingQueue | null;
  currentItem: UserItemLocal | null;
  isComplete: boolean;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setActiveItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setQueue: Dispatch<SetStateAction<InitialTrainingQueue | null>>;
  setHasProgress: Dispatch<SetStateAction<boolean>>;
  setIsComplete: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error | null>>;
  resetQuestionState: () => void;
}>;

async function advanceInitialTraining(options: AdvanceInitialTrainingOptions): Promise<void> {
  const {
    outcome,
    queue,
    currentItem,
    isComplete,
    setItems,
    setActiveItems,
    setQueue,
    setHasProgress,
    setIsComplete,
    setError,
    resetQuestionState,
  } = options;
  if (!queue || !currentItem || isComplete) return;

  const dateTime = new Date(Date.now()).toISOString();
  const progressOptions = { initialTraining: true };
  const updatedItem = UserItem.applyPracticeProgress(
    currentItem,
    outcome,
    dateTime,
    progressOptions,
  );

  try {
    const nextQueue = getTrainingAnswerQueue(
      queue,
      currentItem.item_id,
      outcome,
    );
    await UserItem.saveInitialTrainingProgress(updatedItem);
    await syncPersistedItemToReviewCache(updatedItem);
    invalidateNextInitialLesson(updatedItem.user_id);

    if (!nextQueue) {
      setHasProgress(true);
      setIsComplete(true);
      setError(null);
      return;
    }

    resetQuestionState();
    setItems((currentItems) => updateTrainingItem(currentItems, updatedItem));
    setActiveItems((currentItems) =>
      getActiveTrainingItems(updateTrainingItem(currentItems, updatedItem), nextQueue),
    );
    setQueue(nextQueue);
    setHasProgress(true);
    setError(null);
  } catch (caughtError) {
    const normalizedError = toError(caughtError);
    setError(normalizedError);
    reportError('Failed to advance new-lesson training', normalizedError);
  }
}

export function useInitialTrainingDeck(
  userId: string | null,
  initialData?: InitialTrainingData,
  onComplete?: PracticeCompletionHandler,
) {
  const { trackPracticeWrite, finishPractice } = usePracticeAvailabilityBoundary(userId);
  const initialState = getInitialTrainingState(initialData);
  const [lesson, setLesson] = useState<LessonType | null>(initialState.lesson);
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
  const [queue, setQueue] = useState<InitialTrainingQueue | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(userId != null);
  const [error, setError] = useState<Error | null>(null);
  const isTransitioningRef = useRef(false);
  const completionHandledRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    return startInitialTrainingLoad(userId, initialData, {
      setLesson,
      setItems,
      setActiveItems,
      setInitialItemCount,
      setResolvedEntries,
      setGrammar,
      setGrammarGroup,
      setQueue,
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
        queue,
        itemById,
        resolvedEntries,
        isComplete,
        revealed,
        initialItemCount,
      ),
    [activeItems, initialItemCount, isComplete, itemById, queue, resolvedEntries, revealed],
  );
  const cardState = usePracticeCardState({
    currentItem,
    revealed,
    isCompletion: isComplete,
    setRevealed,
  });
  const resetQuestionState = cardState.resetQuestionState;
  const completePractice = useCallback(async () => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    await finishPractice();
    onComplete?.();
  }, [finishPractice, onComplete]);

  useEffect(() => {
    if (!isComplete) return;
    void completePractice();
  }, [completePractice, isComplete]);

  const advance = useCallback(
    async (outcome: TrainingOutcome) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      try {
        await trackPracticeWrite(
          advanceInitialTraining({
            outcome,
            queue,
            currentItem,
            isComplete,
            setItems,
            setActiveItems,
            setQueue,
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
      queue,
      trackPracticeWrite,
    ],
  );

  const completeCurrent = useCallback(() => advance('skip'), [advance]);

  return {
    lesson,
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
