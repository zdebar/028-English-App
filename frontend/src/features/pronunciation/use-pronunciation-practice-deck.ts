import UserItem from '@/database/models/user-items';
import { usePracticeCardState } from '@/features/practice/hooks/use-practice-card-state';
import { useFetch } from '@/hooks/use-fetch';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useState } from 'react';

export function usePronunciationPracticeDeck(userId: string | null) {
  const [items, setItems] = useState<UserItemLocal[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(true);

  const fetchDeck = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getPronunciationPracticeDeck(userId);
  }, [userId]);
  const { data, loading, error } = useFetch<UserItemLocal[]>(fetchDeck);

  const currentItem = items[index] ?? null;
  const cardState = usePracticeCardState({
    currentItem,
    isCzToEn: false,
    revealed,
    setRevealed,
  });

  useEffect(() => {
    setItems(data ?? []);
    setIndex(0);
    setRevealed(true);
    cardState.resetHint();
    cardState.hideDirectionChange();
  }, [cardState.hideDirectionChange, cardState.resetHint, data]);

  const next = useCallback(async () => {
    if (!currentItem) return;

    if (index < items.length - 1) {
      setIndex(index + 1);
    } else {
      const nextRoundItems = await fetchDeck();
      setItems(nextRoundItems);
      setIndex(0);
    }

    setRevealed(true);
    cardState.resetHint();
    cardState.hideDirectionChange();
  }, [
    cardState.hideDirectionChange,
    cardState.resetHint,
    currentItem,
    fetchDeck,
    index,
    items.length,
  ]);

  return {
    ...cardState,
    currentItem,
    revealed,
    loading,
    error,
    progressLabel: items.length > 0 ? `${index + 1} / ${items.length}` : '0 / 0',
    next,
  };
}
