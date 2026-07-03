import config from '@/config/config';
import Grammar from '@/database/models/grammar';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import type { UserItemPractice } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NBSP, useHint } from './use-hint';

type NewGrammarRound = 0 | 1;

const ROUND_DIRECTIONS: Record<NewGrammarRound, 'czToEn' | 'enToCz'> = {
  0: 'czToEn',
  1: 'enToCz',
};

export function useNewGrammarPracticeDeck(userId: string | null) {
  const [block, setBlock] = useState<UserBlockType | null>(null);
  const [items, setItems] = useState<UserItemPractice[]>([]);
  const [grammar, setGrammar] = useState<GrammarDetail | null>(null);
  const [round, setRound] = useState<NewGrammarRound>(0);
  const [currentQueue, setCurrentQueue] = useState<UserItemPractice[]>([]);
  const [nextWaveQueue, setNextWaveQueue] = useState<UserItemPractice[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextBlock = await UserBlock.getFirstUnlockedGrammarBlock(userId);
        if (nextBlock == null) {
          if (isMounted) {
            setBlock(null);
            setItems([]);
            setGrammar(null);
            setCurrentQueue([]);
            setNextWaveQueue([]);
          }
          return;
        }

        const blockItems = (await UserItem.getByBlockId(userId, nextBlock.block_id)).map(
          (item): UserItemPractice => ({
            ...item,
            show_new_grammar_indicator: false,
          }),
        );
        const grammarData =
          nextBlock.grammar_id == null ? null : await Grammar.getById(nextBlock.grammar_id);
        if (!isMounted) return;

        setBlock(nextBlock);
        setItems(blockItems);
        setGrammar(grammarData);
        setRound(0);
        setCurrentQueue(blockItems);
        setNextWaveQueue([]);
        setIsComplete(false);
        setRevealed(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err);
        setBlock(null);
        setItems([]);
        setGrammar(null);
        setCurrentQueue([]);
        setNextWaveQueue([]);
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
  }, [userId]);

  const currentItem = useMemo(() => currentQueue[0] ?? null, [currentQueue]);

  const { czechHinted, englishHinted, resetHint, plusHint } = useHint(
    currentItem?.czech,
    currentItem?.english,
  );

  const {
    playAudio: playAudioInternal,
    audioError,
    loading: audioLoading,
    isPlaying,
  } = useAudioManager(currentItem?.audio ?? null);

  const isCzToEn = ROUND_DIRECTIONS[round] === 'czToEn';
  const audioDisabled = (isCzToEn && !revealed) || !currentItem?.audio || audioError;
  const czech = isCzToEn || revealed ? currentItem?.czech : czechHinted;
  const english = revealed || (audioDisabled && !isCzToEn) ? currentItem?.english : englishHinted;

  const [wasCzToEn, setWasCzToEn] = useState<boolean | null>(null);
  const showDirectionChange = wasCzToEn !== isCzToEn;
  const hideDirectionChange = useCallback(() => {
    setWasCzToEn(isCzToEn);
  }, [isCzToEn]);

  const resetQuestionState = useCallback(() => {
    setRevealed(false);
    resetHint();
  }, [resetHint]);

  const completeBlock = useCallback(
    async (dateTime: string = new Date().toISOString()) => {
      if (!userId || !block) return;

      await UserItem.saveNewGrammarBlockCompletion(userId, block.block_id, dateTime);
      await UserBlock.markBlockMastered(userId, block.block_id, dateTime);
      setIsComplete(true);
      setCurrentQueue([]);
      setNextWaveQueue([]);
      resetQuestionState();
    },
    [block, resetQuestionState, userId],
  );

  const setNextQueueState = useCallback(
    async (
      remainingCurrentQueue: UserItemPractice[],
      remainingNextWaveQueue: UserItemPractice[],
      nextRoundItems: UserItemPractice[],
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

        const remainingCurrentQueue = currentQueue.slice(1);
        const remainingNextWaveQueue = shouldRepeat
          ? [...nextWaveQueue, currentItem]
          : nextWaveQueue;

        await setNextQueueState(remainingCurrentQueue, remainingNextWaveQueue, items);
      } catch (error) {
        reportError('Failed to advance new grammar practice', error);
      }
    },
    [
      block,
      currentItem,
      currentQueue,
      isComplete,
      items,
      nextWaveQueue,
      setNextQueueState,
      userId,
    ],
  );

  const completeCurrent = useCallback(async () => {
    if (!userId || !block || !currentItem || isComplete) return;

    try {
      const dateTime = new Date().toISOString();
      const skippedItem: UserItemPractice = {
        ...currentItem,
        progress: Math.max(currentItem.progress + config.progress.skipProgress, 0),
        progress_history: [
          ...currentItem.progress_history,
          {
            progress: Math.max(currentItem.progress + config.progress.skipProgress, 0),
            created_at: dateTime,
          },
        ],
      };
      const remainingItems = items.filter((item) => item.item_id !== currentItem.item_id);
      const remainingCurrentQueue = currentQueue
        .slice(1)
        .filter((item) => item.item_id !== currentItem.item_id);
      const remainingNextWaveQueue = nextWaveQueue.filter(
        (item) => item.item_id !== currentItem.item_id,
      );

      await UserItem.savePracticeDeck([skippedItem], dateTime);
      await UserScore.addItemCount(userId, 1);
      setItems(remainingItems);

      if (remainingItems.length === 0) {
        await completeBlock(dateTime);
        return;
      }

      await setNextQueueState(remainingCurrentQueue, remainingNextWaveQueue, remainingItems);
    } catch (error) {
      reportError('Failed to skip new grammar practice item', error);
      throw error;
    }
  }, [
    block,
    completeBlock,
    currentItem,
    currentQueue,
    isComplete,
    items,
    nextWaveQueue,
    setNextQueueState,
    userId,
  ]);

  useEffect(() => {
    if (audioDisabled || isCzToEn || audioLoading || showDirectionChange) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      playAudioInternal();
    }, config.practice.audioDelay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [audioDisabled, isCzToEn, audioLoading, showDirectionChange, playAudioInternal, currentItem]);

  const handleReveal = useCallback(() => {
    if (showDirectionChange) {
      hideDirectionChange();
      return;
    }

    if (isCzToEn && !audioError && !revealed) {
      playAudioInternal();
    }

    setRevealed(true);
  }, [audioError, hideDirectionChange, isCzToEn, playAudioInternal, revealed, showDirectionChange]);

  return {
    block,
    grammar,
    isComplete,
    loading,
    error,
    currentItem,
    noteId: currentItem?.note_id ?? null,
    grammarId: currentItem?.grammar_id ?? null,
    progressLabel: `${TEXTS.newGrammarRound} ${round + 1}/2`,
    isCzToEn,
    revealed,
    showNewGrammarIndicator: false,
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
