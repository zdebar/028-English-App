import config from '@/config/config';
import PracticeSession from '@/database/models/practice-sessions';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import type { GrammarChunkType, GrammarGroupType, UserBlockType } from '@/types/generic.types';
import type { NewPracticePhase, PracticeSessionType } from '@/types/practice-session.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import type { BlockTrainingData } from '@/routing/route-data';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import { resolvePracticeEntries, resolvePracticeGrammarContext } from '@/database/utils/practice-content.utils';

const PHASE_DIRECTIONS: Record<NewPracticePhase, 'czToEn' | 'enToCz'> = {
  0: 'czToEn',
  1: 'enToCz',
  2: 'czToEn',
  3: 'enToCz',
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function toGrammarDetail(grammar: GrammarChunkType | null | undefined): GrammarDetail | null {
  if (!grammar) return null;
  return { ...grammar, kind: 'chunk' };
}

export function useBlockTrainingDeck(
  userId: string | null,
  blockId: number | null,
  initialData?: BlockTrainingData,
) {
  const [block, setBlock] = useState<UserBlockType | null>(initialData?.block ?? null);
  const [items, setItems] = useState<UserItemLocal[]>(initialData?.items ?? []);
  const [resolvedEntries, setResolvedEntries] = useState<Array<ResolvedPracticeEntry<UserItemLocal>>>(
    initialData?.entries ?? [],
  );
  const [grammar, setGrammar] = useState<GrammarDetail | null>(() => toGrammarDetail(initialData?.grammar));
  const [grammarGroup, setGrammarGroup] = useState<GrammarGroupType | null>(initialData?.grammarGroup ?? null);
  const [session, setSession] = useState<PracticeSessionType | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [celebratingStar, setCelebratingStar] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(userId != null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || blockId == null) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const nextBlock = initialData?.block ?? (await UserBlock.getByBlockId(userId, blockId));
        if (
          !nextBlock ||
          !nextBlock.is_practice_block ||
          nextBlock.started_at !== config.database.nullReplacementDate
        ) {
          if (mounted) setBlock(null);
          return;
        }

        const blockItems = initialData?.items ?? (await UserItem.getByBlockId(userId, blockId));
        if (blockItems.length === 0) {
          if (mounted) setBlock(null);
          return;
        }
        const entries = initialData?.entries ?? (await resolvePracticeEntries(userId, blockItems));
        const grammarContext = initialData
          ? { grammar: initialData.grammar, grammarGroup: initialData.grammarGroup }
          : await resolvePracticeGrammarContext(userId, nextBlock.grammar_chunk_id);
        const existing = await PracticeSession.reconcileActive(userId);
        if (existing && (existing.mode !== 'new' || existing.block_id !== blockId)) {
          throw new Error('Another practice session is already active.');
        }
        const activeSession =
          existing ??
          (await PracticeSession.startNew(
            userId,
            blockId,
            blockItems.map((item) => item.item_id),
          ));
        if (!mounted) return;
        setBlock(nextBlock);
        setItems(blockItems);
        setResolvedEntries(entries);
        setGrammar(toGrammarDetail(grammarContext.grammar));
        setGrammarGroup(grammarContext.grammarGroup);
        setSession(activeSession);
        setHasProgress(Boolean(existing && (existing.phase !== 0 || existing.completed_item_ids.length > 0)));
      } catch (caughtError) {
        if (mounted) setError(toError(caughtError));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [blockId, initialData, userId]);

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.item_id, item])),
    [items],
  );
  const currentItemId = session?.current_queue_item_ids[0];
  const currentItem = currentItemId == null ? null : (itemById.get(currentItemId) ?? null);
  const currentEntry = useMemo(
    () => resolvedEntries.find((entry) => entry.item.item_id === currentItem?.item_id) ?? null,
    [currentItem?.item_id, resolvedEntries],
  );
  const phase = session?.phase ?? 0;
  const isCzToEn = PHASE_DIRECTIONS[phase] === 'czToEn';
  const cardState = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });
  const resetQuestionState = cardState.resetQuestionState;

  const finishBlock = useCallback(async () => {
    if (!userId || !block) return;
    const dateTime = new Date(Date.now()).toISOString();
    await PracticeSession.completeNewBlock(userId, block.block_id, dateTime);
    invalidateRouteData(routeDataKey('block-training', userId, block.block_id));
    invalidateRouteData(routeDataKey('practice', userId));
    setCelebratingStar(true);
    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, config.practice.starCelebrationDurationMs);
    });
    setIsComplete(true);
  }, [block, userId]);

  const moveToNextPhase = useCallback(
    async (currentSession: PracticeSessionType): Promise<PracticeSessionType | null> => {
      const currentPhase = currentSession.phase ?? 0;
      if (currentPhase === 3) {
        await finishBlock();
        return null;
      }

      const nextPhase = (currentPhase + 1) as NewPracticePhase;
      const orderedIds = items.map((item) => item.item_id);
      const nextIds = nextPhase >= 2 ? shuffleOnce(orderedIds) : orderedIds;
      return {
        ...currentSession,
        phase: nextPhase,
        completed_count: 0,
        current_queue_item_ids: nextIds,
        retry_queue_item_ids: [],
        completed_item_ids: [],
        updated_at: new Date(Date.now()).toISOString(),
      };
    },
    [finishBlock, items],
  );

  const advance = useCallback(
    async (shouldRepeat: boolean) => {
      if (!session || !currentItem || celebratingStar || isComplete) return;
      try {
        const remaining = session.current_queue_item_ids.slice(1);
        const retryIds = shouldRepeat
          ? [...session.retry_queue_item_ids, currentItem.item_id]
          : session.retry_queue_item_ids;
        const completedIds = shouldRepeat
          ? session.completed_item_ids
          : [...session.completed_item_ids, currentItem.item_id];
        let nextSession: PracticeSessionType = {
          ...session,
          completed_count: completedIds.length,
          current_queue_item_ids: remaining,
          retry_queue_item_ids: retryIds,
          completed_item_ids: completedIds,
          updated_at: new Date(Date.now()).toISOString(),
        };

        if (remaining.length === 0 && retryIds.length > 0) {
          nextSession = {
            ...nextSession,
            current_queue_item_ids: retryIds,
            retry_queue_item_ids: [],
          };
        } else if (remaining.length === 0) {
          const followingPhase = await moveToNextPhase(nextSession);
          if (!followingPhase) return;
          nextSession = followingPhase;
        }

        await PracticeSession.put(nextSession);
        setSession(nextSession);
        setHasProgress(true);
        resetQuestionState();
      } catch (caughtError) {
        const normalizedError = toError(caughtError);
        setError(normalizedError);
        reportError('Failed to advance new-block training', normalizedError);
      }
    },
    [celebratingStar, currentItem, isComplete, moveToNextPhase, resetQuestionState, session],
  );

  const completeCurrent = useCallback(async () => {
    if (!session || !currentItem) return;
    const dateTime = new Date(Date.now()).toISOString();
    const skippedItem = UserItem.applyPracticeProgress(
      currentItem,
      PHASE_DIRECTIONS[phase],
      'skip',
      dateTime,
    );
    try {
      await UserItem.savePracticeDeck([{ ...skippedItem, practice_direction: PHASE_DIRECTIONS[phase] }]);
      setItems((currentItems) =>
        currentItems.map((item) => (item.item_id === skippedItem.item_id ? skippedItem : item)),
      );
      await advance(false);
    } catch (caughtError) {
      const normalizedError = toError(caughtError);
      setError(normalizedError);
      reportError('Failed to skip new-block item', normalizedError);
      throw normalizedError;
    }
  }, [advance, currentItem, phase, session]);

  return {
    block,
    items,
    grammar,
    grammarGroup,
    isComplete,
    celebratingStar,
    hasProgress,
    loading,
    error,
    currentItem,
    note: currentEntry?.note ?? null,
    practiceGrammar: currentEntry?.grammar ?? null,
    progressLabel: `${phase + 1}/4 · ${session?.completed_count ?? 0}/${items.length}`,
    isCzToEn,
    revealed,
    czech: cardState.czech,
    english: cardState.english,
    pronunciation: revealed ? currentItem?.pronunciation || NBSP : NBSP,
    audioDisabled: cardState.audioDisabled,
    showDirectionChange: cardState.showDirectionChange,
    handleReveal: cardState.handleReveal,
    plusHint: cardState.plusHint,
    nextRepeat: () => advance(true),
    nextKnown: () => advance(false),
    completeCurrent,
    audioError: cardState.audioError,
    playAudio: cardState.playAudio,
    audioLoading: cardState.audioLoading,
    isPlaying: cardState.isPlaying,
  };
}

function shuffleOnce(ids: number[]): number[] {
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}
