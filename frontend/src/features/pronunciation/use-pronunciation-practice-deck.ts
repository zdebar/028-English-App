import config from '@/config/config';
import { loadPronunciationPracticeDeck } from '@/database/utils/practice-content.utils';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useFetch } from '@/hooks/use-fetch';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useState } from 'react';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';

const NBSP = '\u00A0';

export function usePronunciationPracticeDeck(
  userId: string | null,
  initialDeck?: Array<ResolvedPracticeEntry<UserItemLocal>>,
) {
  const [index, setIndex] = useState(0);

  const fetchDeck = useCallback(async () => {
    if (!userId) return [];
    return loadPronunciationPracticeDeck(userId);
  }, [userId]);
  const { data, loading, error, reload } = useFetch<
    Array<ResolvedPracticeEntry<UserItemLocal>>
  >(fetchDeck, { initialData: initialDeck });

  const entries = data ?? [];
  const currentEntry = entries[index] ?? null;
  const currentItem = currentEntry?.item ?? null;
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
    if (!currentItem || entries.length <= 1) return;

    if (index < entries.length - 1) {
      setIndex((currentIndex) => currentIndex + 1);
      return;
    }

    setIndex(0);
    await reload();
  }, [currentItem, entries.length, index, reload]);

  const handleSelectionChange = useCallback(
    (selected: boolean) => {
      if (selected) return;
      setIndex(0);
      if (userId) invalidateRouteData(routeDataKey('pronunciation-practice', userId));
      void reload();
    },
    [reload, userId],
  );

  return {
    currentItem,
    note: currentEntry?.note ?? null,
    grammar: currentEntry?.grammar ?? null,
    loading,
    error,
    audioDisabled,
    audioError,
    audioLoading,
    czech: currentItem?.czech,
    english: currentItem?.english,
    playAudio,
    pronunciation: currentItem?.pronunciation || NBSP,
    progressLabel: entries.length > 0 ? `${index + 1} / ${entries.length}` : '0 / 0',
    canGoNext: entries.length > 1,
    handleSelectionChange,
    next,
  };
}
