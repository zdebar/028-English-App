import config from '@/config/config';
import GrammarChunk from '@/database/models/grammar-chunks';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import type { GrammarChunkType, UserBlockType } from '@/types/generic.types';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import type { BlockTrainingData } from '@/routing/route-data';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-cache';

type BlockTrainingRound = 0 | 1;

const ROUND_DIRECTIONS: Record<BlockTrainingRound, 'czToEn' | 'enToCz'> = {
  0: 'czToEn',
  1: 'enToCz',
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
  const [grammar, setGrammar] = useState<GrammarDetail | null>(() =>
    toGrammarDetail(initialData?.grammar),
  );
  const [round, setRound] = useState<BlockTrainingRound>(0);
  const [totalItemCount, setTotalItemCount] = useState(initialData?.items.length ?? 0);
  const [completedItemIds, setCompletedItemIds] = useState<Set<number>>(
    () => new Set<number>(),
  );
  const [currentQueue, setCurrentQueue] = useState<UserItemLocal[]>(initialData?.items ?? []);
  const [nextWaveQueue, setNextWaveQueue] = useState<UserItemLocal[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(userId != null && initialData == null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError(null);
      return;
    }

    if (initialData) {
      setBlock(initialData.block);
      setItems(initialData.items);
      setGrammar(toGrammarDetail(initialData.grammar));
      setTotalItemCount(initialData.items.length);
      setCompletedItemIds(new Set());
      setRound(0);
      setCurrentQueue(initialData.items);
      setNextWaveQueue([]);
      setIsComplete(false);
      setRevealed(false);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextBlock = blockId == null ? null : await UserBlock.getByBlockId(userId, blockId);
        if (
          !nextBlock?.requires_initial_training ||
          nextBlock.started_at !== config.database.nullReplacementDate
        ) {
          if (isMounted) {
            setBlock(null);
            setItems([]);
            setTotalItemCount(0);
            setCompletedItemIds(new Set());
            setGrammar(null);
            setCurrentQueue([]);
            setNextWaveQueue([]);
          }
          return;
        }

        const blockItems = await UserItem.getByBlockId(userId, nextBlock.block_id);
        const grammarData =
          nextBlock.grammar_chunk_id == null
            ? null
            : await GrammarChunk.getById(nextBlock.grammar_chunk_id);
        if (!isMounted) return;

        setBlock(nextBlock);
        setItems(blockItems);
        setTotalItemCount(blockItems.length);
        setCompletedItemIds(new Set());
        setGrammar(toGrammarDetail(grammarData));
        setRound(0);
        setCurrentQueue(blockItems);
        setNextWaveQueue([]);
        setIsComplete(false);
        setRevealed(false);
      } catch (err) {
        if (!isMounted) return;
        setError(toError(err));
        setBlock(null);
        setItems([]);
        setGrammar(null);
        setCurrentQueue([]);
        setNextWaveQueue([]);
        setTotalItemCount(0);
        setCompletedItemIds(new Set());
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [blockId, initialData, userId]);

  const currentItem = useMemo(() => currentQueue[0] ?? null, [currentQueue]);

  const isCzToEn = ROUND_DIRECTIONS[round] === 'czToEn';
  const {
    audioDisabled,
    audioError,
    audioLoading,
    czech,
    english,
    handleReveal,
    isPlaying,
    playAudio: playAudioInternal,
    plusHint,
    resetQuestionState,
    showDirectionChange,
  } = usePracticeCardState({ currentItem, isCzToEn, revealed, setRevealed });

  const completeBlock = useCallback(
    async (dateTime: string = new Date().toISOString()) => {
      if (!userId || !block) return;

      await UserItem.saveInitialTrainingBlockCompletion(userId, block.block_id, dateTime);
      await UserBlock.completeInitialTraining(userId, block.block_id, dateTime);
      invalidateRouteData(routeDataKey('block-training', userId, block.block_id));
      invalidateRouteData(routeDataKey('practice', userId));
      setIsComplete(true);
      setCurrentQueue([]);
      setNextWaveQueue([]);
      resetQuestionState();
    },
    [block, resetQuestionState, userId],
  );

  const setNextQueueState = useCallback(
    async (
      remainingCurrentQueue: UserItemLocal[],
      remainingNextWaveQueue: UserItemLocal[],
      nextRoundItems: UserItemLocal[],
    ) => {
      if (remainingCurrentQueue.length > 0) {
        setCurrentQueue(remainingCurrentQueue);
        setNextWaveQueue(remainingNextWaveQueue);
        resetQuestionState();
        return;
      }

      if (remainingNextWaveQueue.length > 0) {
        setCurrentQueue(remainingNextWaveQueue);
        setNextWaveQueue([]);
        resetQuestionState();
        return;
      }

      if (round === 0 && nextRoundItems.length > 0) {
        setRound(1);
        setCompletedItemIds(new Set());
        setCurrentQueue(nextRoundItems);
        setNextWaveQueue([]);
        resetQuestionState();
        return;
      }

      await completeBlock();
    },
    [completeBlock, resetQuestionState, round],
  );

  const advance = useCallback(
    async (shouldRepeat: boolean) => {
      if (!userId || !block || !currentItem || isComplete) return;

      try {
        await UserScore.addItemCount(userId, 1);

        if (!shouldRepeat) {
          setCompletedItemIds((previous) => {
            const next = new Set(previous);
            next.add(currentItem.item_id);
            return next;
          });
        }

        const remainingCurrentQueue = currentQueue.slice(1);
        const remainingNextWaveQueue = shouldRepeat
          ? [...nextWaveQueue, currentItem]
          : nextWaveQueue;

        await setNextQueueState(remainingCurrentQueue, remainingNextWaveQueue, items);
      } catch (error) {
        reportError('Failed to advance block training', error);
      }
    },
    [block, currentItem, currentQueue, isComplete, items, nextWaveQueue, setNextQueueState, userId],
  );

  const completeCurrent = useCallback(async () => {
    if (!userId || !block || !currentItem || isComplete) return;

    try {
      const dateTime = new Date().toISOString();
      const skippedItem = UserItem.applyPracticeProgress(
        currentItem,
        ROUND_DIRECTIONS[round],
        'skip',
        dateTime,
      );
      const updatedItems = items.map((item) =>
        item.item_id === currentItem.item_id ? skippedItem : item,
      );
      const remainingCurrentQueue = currentQueue
        .slice(1)
        .filter((item) => item.item_id !== currentItem.item_id);
      const remainingNextWaveQueue = nextWaveQueue.filter(
        (item) => item.item_id !== currentItem.item_id,
      );

      await UserItem.savePracticeDeck([
        { ...skippedItem, practice_direction: ROUND_DIRECTIONS[round] },
      ]);
      await UserScore.addItemCount(userId, 1);
      setCompletedItemIds((previous) => {
        const next = new Set(previous);
        next.add(currentItem.item_id);
        return next;
      });
      setItems(updatedItems);

      await setNextQueueState(remainingCurrentQueue, remainingNextWaveQueue, updatedItems);
    } catch (error) {
      reportError('Failed to skip block training item', error);
      throw error;
    }
  }, [
    block,
    currentItem,
    currentQueue,
    isComplete,
    items,
    nextWaveQueue,
    setNextQueueState,
    userId,
  ]);

  return {
    block,
    items,
    grammar,
    isComplete,
    loading,
    error,
    currentItem,
    noteId: currentItem?.note_id ?? null,
    grammarChunkId: currentItem?.grammar_chunk_id ?? null,
    progressLabel: `${round + 1}/2 · ${completedItemIds.size}/${totalItemCount}`,
    isCzToEn,
    revealed,
    czech,
    english,
    pronunciation: revealed ? currentItem?.pronunciation || NBSP : NBSP,
    audioDisabled,
    showDirectionChange,
    handleReveal,
    plusHint,
    nextRepeat: () => advance(true),
    nextKnown: () => advance(false),
    completeCurrent,
    audioError,
    playAudio: playAudioInternal,
    audioLoading,
    isPlaying,
  };
}
