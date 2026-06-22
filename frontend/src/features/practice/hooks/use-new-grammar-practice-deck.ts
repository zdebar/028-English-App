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
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NBSP, useHint } from './use-hint';

type NewGrammarRound = 0 | 1 | 2 | 3;

const ROUND_DIRECTIONS: Record<NewGrammarRound, 'czToEn' | 'enToCz'> = {
  0: 'czToEn',
  1: 'enToCz',
  2: 'czToEn',
  3: 'enToCz',
};

function getRoundTarget(round: NewGrammarRound): number {
  if (round === 2) return 1;
  if (round === 3) return 2;
  return 0;
}

function pickRandomItem(
  items: UserItemLocal[],
  progressByItemId: Map<number, number>,
  target: number,
): UserItemLocal | null {
  const candidates = items.filter((item) => (progressByItemId.get(item.item_id) ?? 0) < target);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function useNewGrammarPracticeDeck(userId: string | null) {
  const [block, setBlock] = useState<UserBlockType | null>(null);
  const [items, setItems] = useState<UserItemLocal[]>([]);
  const [grammar, setGrammar] = useState<GrammarDetail | null>(null);
  const [round, setRound] = useState<NewGrammarRound>(0);
  const [orderedIndex, setOrderedIndex] = useState(0);
  const [randomItem, setRandomItem] = useState<UserItemLocal | null>(null);
  const [progressByItemId, setProgressByItemId] = useState<Map<number, number>>(() => new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const load = async () => {
      const nextBlock = await UserBlock.getFirstUnlockedGrammarBlock(userId);
      if (nextBlock == null) {
        if (isMounted) setBlock(null);
        return;
      }

      const blockItems = await UserItem.getByBlockId(userId, nextBlock.block_id);
      const grammarData =
        nextBlock.grammar_id == null ? null : await Grammar.getById(nextBlock.grammar_id);
      const initialProgress = new Map(blockItems.map((item) => [item.item_id, 0]));
      if (!isMounted) return;

      setBlock(nextBlock);
      setItems(blockItems);
      setGrammar(grammarData);
      setProgressByItemId(initialProgress);
      setRandomItem(pickRandomItem(blockItems, initialProgress, 1));
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const currentItem = useMemo(() => {
    if (round < 2) return items[orderedIndex] ?? null;
    return randomItem;
  }, [items, orderedIndex, randomItem, round]);

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

  const advance = useCallback(
    async (isKnown: boolean) => {
      if (!userId || !block || !currentItem || isComplete) return;

      try {
        await UserScore.addItemCount(userId, 1);

        if (round < 2) {
          const nextIndex = orderedIndex + 1;
          if (nextIndex < items.length) {
            setOrderedIndex(nextIndex);
            resetQuestionState();
            return;
          }

          const nextRound = (round + 1) as NewGrammarRound;
          setRound(nextRound);
          setOrderedIndex(0);
          resetQuestionState();
          if (nextRound >= 2) {
            setRandomItem(pickRandomItem(items, progressByItemId, getRoundTarget(nextRound)));
          }
          return;
        }

        const target = getRoundTarget(round);
        const nextProgressByItemId = new Map(progressByItemId);
        if (isKnown) {
          nextProgressByItemId.set(
            currentItem.item_id,
            Math.max(nextProgressByItemId.get(currentItem.item_id) ?? 0, target),
          );
        }

        const nextItem = pickRandomItem(items, nextProgressByItemId, target);
        setProgressByItemId(nextProgressByItemId);

        if (nextItem != null) {
          setRandomItem(nextItem);
          resetQuestionState();
          return;
        }

        if (round === 2) {
          const nextRound: NewGrammarRound = 3;
          setRound(nextRound);
          setRandomItem(pickRandomItem(items, nextProgressByItemId, getRoundTarget(nextRound)));
          resetQuestionState();
          return;
        }

        const dateTime = new Date().toISOString();
        await UserItem.saveNewGrammarBlockCompletion(userId, block.block_id, dateTime);
        await UserBlock.markBlockMastered(userId, block.block_id, dateTime);
        setIsComplete(true);
      } catch (error) {
        reportError('Failed to advance new grammar practice', error);
      }
    },
    [
      block,
      currentItem,
      isComplete,
      items,
      orderedIndex,
      progressByItemId,
      resetQuestionState,
      round,
      userId,
    ],
  );

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
    currentItem,
    noteId: currentItem?.note_id ?? null,
    grammarId: currentItem?.grammar_id ?? null,
    progressLabel: `${TEXTS.newGrammarRound} ${round + 1}/4`,
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
    nextRepeat: () => advance(false),
    nextKnown: () => advance(true),
    audioError,
    playAudio: playAudioInternal,
    audioLoading,
    isPlaying,
  };
}
