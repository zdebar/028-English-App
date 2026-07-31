import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useFetch } from '@/hooks/use-fetch';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useState } from 'react';

const NBSP = '\u00A0';

export function usePronunciationPracticeDeck(userId: string | null) {
  const [index, setIndex] = useState(0);

  const fetchDeck = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getPronunciationPracticeDeck(userId);
  }, [userId]);
  const { data, loading, error, reload } = useFetch<UserItemLocal[]>(fetchDeck);

  const items = data ?? [];
  const currentItem = items[index] ?? null;
  const {
    playAudio,
    audioError,
    loading: audioLoading,
  } = useAudioManager(currentItem?.audio ?? null);
  const audioDisabled = !currentItem?.audio || audioError;

  useEffect(() => {
    if (audioDisabled || audioLoading) return;

    const timeoutId = globalThis.setTimeout(() => {
      playAudio();
    }, config.practice.audioDelay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [audioDisabled, audioLoading, currentItem, playAudio]);

  const next = useCallback(async () => {
    if (!currentItem) return;

    if (index < items.length - 1) {
      setIndex((currentIndex) => currentIndex + 1);
      return;
    }

    setIndex(0);
    await reload();
  }, [currentItem, index, items.length, reload]);

  return {
    currentItem,
    loading,
    error,
    audioDisabled,
    audioError,
    audioLoading,
    czech: currentItem?.czech,
    english: currentItem?.english,
    playAudio,
    pronunciation: currentItem?.pronunciation || NBSP,
    progressLabel: items.length > 0 ? `${index + 1} / ${items.length}` : '0 / 0',
    next,
  };
}
