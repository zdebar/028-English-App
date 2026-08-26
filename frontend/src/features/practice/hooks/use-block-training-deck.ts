import config from '@/config/config';
import Block from '@/database/models/blocks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import type { GrammarDetail } from '@/features/grammar/GrammarDetailCard';
import { reportError } from '@/features/logging/monitoring-handler';
import type { BlockType, GrammarChunkType, GrammarGroupType } from '@/types/generic.types';
import type { NewPracticePhase, PracticeSessionType } from '@/types/practice-session.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NBSP } from './use-hint';
import { usePracticeCardState } from './use-practice-card-state';
import type { InitialTrainingData } from '@/routing/route-data';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import { resolvePracticeEntries, resolvePracticeGrammarContext } from '@/database/utils/practice-content.utils';
import { getStarTierForCount, type StarTier } from '@/utils/star-progress.utils';
import { useStarCelebration } from './use-star-celebration';

const PHASE_DIRECTIONS: Record<NewPracticePhase, 'czToEn' | 'enToCz'> = {
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

export function useInitialTrainingDeck(
  userId: string | null,
  initialData?: InitialTrainingData,
) {
  const [block, setBlock] = useState<BlockType | null>(initialData?.block ?? null);
  const [items, setItems] = useState<UserItemLocal[]>(initialData?.items ?? []);
  const [resolvedEntries, setResolvedEntries] = useState<Array<ResolvedPracticeEntry<UserItemLocal>>>(
    initialData?.entries ?? [],
  );
  const [grammar, setGrammar] = useState<GrammarDetail | null>(() => toGrammarDetail(initialData?.grammar));
  const [grammarGroup, setGrammarGroup] = useState<GrammarGroupType | null>(initialData?.grammarGroup ?? null);
  const [session, setSession] = useState<PracticeSessionType | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const {
    celebratingStar,
    waitForAcknowledgement,
    acknowledgeCelebration,
    finishCelebration,
  } = useStarCelebration();
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

    let mounted = true;
    const load = async () => {
      try {
        const selection = initialData
          ? { blockId: initialData.block?.id ?? null, items: initialData.items }
          : await UserItem.getNextInitialTrainingSelection(userId);
        const nextBlock = initialData?.block ??
          (selection?.blockId == null ? null : await Block.getById(selection.blockId));
        const blockItems = selection?.items ?? [];
        if (blockItems.length === 0) {
          if (mounted) setItems([]);
          return;
        }
        const entries = initialData?.entries ?? (await resolvePracticeEntries(userId, blockItems));
        const grammarContext = initialData
          ? { grammar: initialData.grammar, grammarGroup: initialData.grammarGroup }
          : await resolvePracticeGrammarContext(userId, nextBlock?.grammar_chunk_id);
        const existing = await PracticeSession.reconcileActive(userId);
        const selectedBlockId = nextBlock?.id ?? null;
        if (existing && (existing.mode !== 'new' || existing.block_id !== selectedBlockId)) {
          throw new Error('Another practice session is already active.');
        }
        const activeSession =
          existing ??
          (await PracticeSession.startNew(
            userId,
            selectedBlockId,
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
  }, [initialData, userId]);

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

  const finishBlock = useCallback(async (finalItem: UserItemLocal) => {
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
  }, [finishCelebration, items, userId, waitForAcknowledgement]);

  const moveToNextPhase = useCallback(
    async (currentSession: PracticeSessionType): Promise<PracticeSessionType | null> => {
      const currentPhase = currentSession.phase ?? 0;
      if (currentPhase === 1) {
        return null;
      }

      const nextPhase = (currentPhase + 1) as NewPracticePhase;
      const orderedIds = items.map((item) => item.item_id);
      return {
        ...currentSession,
        phase: nextPhase,
        completed_count: 0,
        current_queue_item_ids: orderedIds,
        retry_queue_item_ids: [],
        completed_item_ids: [],
        updated_at: new Date(Date.now()).toISOString(),
      };
    },
    [items],
  );

  const advance = useCallback(
    async (outcome: 'correct' | 'incorrect' | 'skip') => {
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
        const remaining = session.current_queue_item_ids.slice(1);
        const shouldRepeat = outcome === 'incorrect';
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
          if (followingPhase) {
            nextSession = followingPhase;
          } else {
            await finishBlock(updatedItem);
            setItems((currentItems) =>
              currentItems.map((item) =>
                item.item_id === updatedItem.item_id ? updatedItem : item,
              ),
            );
            return;
          }
        }

        await PracticeSession.recordInitialTrainingAnswer(updatedItem, nextSession);
        setItems((currentItems) =>
          currentItems.map((item) => (item.item_id === updatedItem.item_id ? updatedItem : item)),
        );
        setSession(nextSession);
        setHasProgress(true);
        resetQuestionState();
      } catch (caughtError) {
        const normalizedError = toError(caughtError);
        setError(normalizedError);
        reportError('Failed to advance new-block training', normalizedError);
      }
    },
    [celebratingStar, currentItem, finishBlock, isComplete, moveToNextPhase, phase, resetQuestionState, session],
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
    progressLabel: `${phase + 1}/2 · ${session?.completed_count ?? 0}/${items.length}`,
    isCzToEn,
    revealed,
    czech: cardState.czech,
    english: cardState.english,
    pronunciation: revealed ? currentItem?.pronunciation || NBSP : NBSP,
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
