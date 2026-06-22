import Notification from '@/components/UI/Notification';
import StyledButton from '@/components/UI/buttons/StyledButton';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import Grammar from '@/database/models/grammar';
import { useAuthStore } from '@/features/auth/use-auth-store';
import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { UserBlockType } from '@/types/generic.types';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function NewGrammarPractice(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const [block, setBlock] = useState<UserBlockType | null>(null);
  const [items, setItems] = useState<UserItemLocal[]>([]);
  const [grammar, setGrammar] = useState<GrammarDetail | null>(null);
  const [showGrammarIntro, setShowGrammarIntro] = useState(true);
  const [round, setRound] = useState<NewGrammarRound>(0);
  const [orderedIndex, setOrderedIndex] = useState(0);
  const [randomItem, setRandomItem] = useState<UserItemLocal | null>(null);
  const [progressByItemId, setProgressByItemId] = useState<Map<number, number>>(() => new Map());
  const [isComplete, setIsComplete] = useState(false);

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
      const grammarData = nextBlock.grammar_id == null ? null : await Grammar.getById(nextBlock.grammar_id);
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

  const isCzToEn = ROUND_DIRECTIONS[round] === 'czToEn';
  const directionText = isCzToEn ? TEXTS.directionCzToEn : TEXTS.directionEnToCz;

  const advance = useCallback(
    async (isKnown: boolean) => {
      if (!userId || !block || !currentItem || isComplete) return;

      try {
        await UserScore.addItemCount(userId, 1);

        if (round < 2) {
          const nextIndex = orderedIndex + 1;
          if (nextIndex < items.length) {
            setOrderedIndex(nextIndex);
            return;
          }

          const nextRound = (round + 1) as NewGrammarRound;
          setRound(nextRound);
          setOrderedIndex(0);
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
          return;
        }

        if (round === 2) {
          const nextRound: NewGrammarRound = 3;
          setRound(nextRound);
          setRandomItem(pickRandomItem(items, nextProgressByItemId, getRoundTarget(nextRound)));
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
    [block, currentItem, isComplete, items, orderedIndex, progressByItemId, round, userId],
  );

  if (!userId) {
    return <Notification>{TEXTS.notAvailable}</Notification>;
  }

  if (!block) {
    return <Notification>{TEXTS.nothingToPractice}</Notification>;
  }

  if (showGrammarIntro && grammar != null) {
    return <GrammarDetailCard grammar={grammar} onClose={() => setShowGrammarIntro(false)} />;
  }

  if (isComplete) {
    return (
      <div className="card-width flex flex-col gap-4 p-4 text-center">
        <Notification>{TEXTS.newGrammarComplete}</Notification>
        <StyledButton className="h-controls px-4" onClick={() => navigate(ROUTES.home)}>
          {TEXTS.tooltipHome}
        </StyledButton>
      </div>
    );
  }

  if (!currentItem) {
    return <Notification>{TEXTS.nothingToPractice}</Notification>;
  }

  return (
    <div className="help-btn-margin relative flex w-full grow flex-col items-center">
      <div className="card-width card-height relative gap-1">
        <div className="color-button relative flex h-full grow flex-col items-center justify-between p-4 select-none">
          <p className="px-2 text-sm">{directionText}</p>
          <div className="flex h-full flex-col justify-center gap-1">
            <p className="text-center font-bold">
              {isCzToEn ? currentItem.czech : currentItem.english}
            </p>
            <p className="text-center font-normal">
              {isCzToEn ? currentItem.english : currentItem.czech}
            </p>
            <p className="text-center font-normal">{currentItem.pronunciation}</p>
          </div>
          <p className="px-2 text-sm">
            {TEXTS.newGrammarRound} {round + 1}/4
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-1">
          <StyledButton className="h-controls" onClick={() => void advance(false)}>
            {TEXTS.repeat}
          </StyledButton>
          <StyledButton className="h-controls" onClick={() => void advance(false)}>
            {TEXTS.complete}
          </StyledButton>
          <StyledButton className="h-controls" onClick={() => void advance(true)}>
            {TEXTS.known}
          </StyledButton>
        </div>
      </div>
    </div>
  );
}
