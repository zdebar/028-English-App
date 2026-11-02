import { usePracticeAvailabilityBoundary } from './use-practice-availability-boundary';
import UserItem from '@/database/models/user-items';
import UserLesson from '@/database/models/user-lessons';
import { dataManagerStore, ensureDataManagerReady } from '@/database/state/data-store';
import { selectPreparedInitialLesson } from '@/database/state/data-selectors';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/logging-handler';
import { toError } from '@/utils/error.utils';
import type { LessonType } from '@/types/generic.types';
import type { GroupType } from '@/types/table.types';
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
import type { InitialTrainingData } from '../initial-training-data';

type TrainingOutcome = 'correct' | 'incorrect' | 'skip';

type PracticeCompletionHandler = () => void;

type InitialTrainingLoadResult = Readonly<{
  lesson: LessonType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GroupType | null;
  grammarGroup: GroupType | null;
  groupNote: string | null;
  queue: InitialTrainingQueue;
}>;

type EligibleInitialTrainingData = InitialTrainingData & Readonly<{ lesson: LessonType }>;

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

type InitialTrainingLoadSetters = Readonly<{
  setLesson: Dispatch<SetStateAction<LessonType | null>>;
  setItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setActiveItems: Dispatch<SetStateAction<UserItemLocal[]>>;
  setInitialItemCount: Dispatch<SetStateAction<number>>;
  setResolvedEntries: Dispatch<SetStateAction<Array<ResolvedPracticeEntry<UserItemLocal>>>>;
  setGrammar: Dispatch<SetStateAction<GrammarDetail | null>>;
  setGrammarGroup: Dispatch<SetStateAction<GroupType | null>>;
  setGroupNote: Dispatch<SetStateAction<string | null>>;
  setQueue: Dispatch<SetStateAction<InitialTrainingQueue | null>>;
  setHasProgress: Dispatch<SetStateAction<boolean>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<Error | null>>;
}>;

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
  const [grammarGroup, setGrammarGroup] = useState<GroupType | null>(
    initialState.grammarGroup,
  );
  const [groupNote, setGroupNote] = useState<string | null>(null);
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
      setGroupNote,
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
    groupNote,
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

function toGrammarDetail(grammar: GroupType | null | undefined): GrammarDetail | null {
  if (!grammar) return null;
  return { ...grammar, kind: 'chunk' };
}

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

async function loadInitialTrainingData(
  userId: string,
  initialData: InitialTrainingData | undefined,
): Promise<InitialTrainingLoadResult | null> {
  await ensureDataManagerReady(userId);
  const state = dataManagerStore.getState();
  const prepared = getEligibleInitialTrainingData(state, userId, initialData);
  if (!prepared) return null;

  const didStart = await UserLesson.startIfEligible(
    userId,
    prepared.lesson.id,
    prepared.items.map((item) => item.item_id),
  );
  if (!didStart) return null;

  return {
    ...createInitialTrainingLoadResult(state.groups, prepared),
  };
}

function getEligibleInitialTrainingData(
  state: ReturnType<typeof dataManagerStore.getState>,
  userId: string,
  initialData: InitialTrainingData | undefined,
): EligibleInitialTrainingData | null {
  if (state.userId !== userId || state.status !== 'ready') {
    throw state.error ?? new Error('Application data is not ready for initial training.');
  }
  const prepared = initialData?.lesson ? initialData : selectPreparedInitialLesson(state, userId);
  if (!prepared?.lesson || prepared.items.length === 0) return null;
  return { ...prepared, lesson: prepared.lesson };
}

function createInitialTrainingLoadResult(
  groups: ReturnType<typeof dataManagerStore.getState>['groups'],
  prepared: EligibleInitialTrainingData,
): InitialTrainingLoadResult {
  const lesson = prepared.lesson;
  const lessonGroup = lesson.group_id == null
    ? null
    : groups.find((group) => group.id === lesson.group_id) ?? null;

  return {
    lesson,
    items: prepared.items,
    entries: prepared.entries,
    grammar: prepared.grammar,
    grammarGroup: prepared.grammarGroup,
    groupNote: lessonGroup?.note ?? null,
    queue: {
      currentItemIds: prepared.items.map((item) => item.item_id),
      retryItemIds: [],
      completedCount: 0,
    },
  };
}

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
        setters.setGroupNote(null);
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
      setters.setGroupNote(result.groupNote);
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
