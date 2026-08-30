import config from '@/config/config';
import { loadPronunciationPracticeDeck } from '@/database/utils/practice-content.utils';
import { useAudioManager } from '@/features/audio/use-audio-manager';
import { useFetch } from '@/hooks/use-fetch';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';

const NBSP = '\u00A0';

function getPronunciationAudioDisabled(
  currentItem: UserItemLocal | null,
  audioError: boolean,
): boolean {
  return !currentItem?.audio || audioError;
}

function fetchPronunciationDeck(userId: string | null) {
  if (!userId) return Promise.resolve([] as Array<ResolvedPracticeEntry<UserItemLocal>>);
  return loadPronunciationPracticeDeck(userId);
}

function getPronunciationDeckView(
  data: Array<ResolvedPracticeEntry<UserItemLocal>> | null | undefined,
  index: number,
) {
  const entries = data ?? [];
  const currentEntry = entries[index] ?? null;
  const currentItem = currentEntry?.item ?? null;
  return { entries, currentEntry, currentItem };
}

function getPronunciationDisplay(
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>,
  currentEntry: ResolvedPracticeEntry<UserItemLocal> | null,
  currentItem: UserItemLocal | null,
  index: number,
) {
  const progressLabel = entries.length > 0 ? `${index + 1} / ${entries.length}` : '0 / 0';
  return {
    note: currentEntry?.note ?? null,
    grammar: currentEntry?.grammar ?? null,
    czech: currentItem?.czech,
    english: currentItem?.english,
    pronunciation: currentItem?.pronunciation || NBSP,
    progressLabel,
    canGoNext: entries.length > 1,
  };
}

function schedulePronunciationAudio(
  audioDisabled: boolean,
  audioLoading: boolean,
  playAudio: () => void,
): (() => void) | undefined {
  if (audioDisabled || audioLoading) return undefined;
  const timeoutId = globalThis.setTimeout(playAudio, config.practice.audioDelay);
  return () => globalThis.clearTimeout(timeoutId);
}

async function advancePronunciationDeck(
  currentItem: UserItemLocal | null,
  entriesLength: number,
  index: number,
  setIndex: (value: number | ((current: number) => number)) => void,
  reload: () => Promise<unknown>,
): Promise<void> {
  if (!currentItem || entriesLength <= 1) return;
  if (index < entriesLength - 1) {
    setIndex((currentIndex) => currentIndex + 1);
    return;
  }
  setIndex(0);
  await reload();
}

function handlePronunciationSelectionChange(
  selected: boolean,
  userId: string | null,
  setIndex: (value: number) => void,
  reload: () => Promise<unknown>,
): void {
  if (selected) return;
  setIndex(0);
  if (userId) invalidateRouteData(routeDataKey('pronunciation-practice', userId));
  void reload();
}

export function usePronunciationPracticeDeck(
  userId: string | null,
  initialDeck?: Array<ResolvedPracticeEntry<UserItemLocal>>,
) {
  const [index, setIndex] = useState(0);

  const fetchDeck = useCallback(() => fetchPronunciationDeck(userId), [userId]);
  const { data, loading, error, reload } = useFetch<Array<ResolvedPracticeEntry<UserItemLocal>>>(
    fetchDeck,
    { initialData: initialDeck },
  );

  const { entries, currentEntry, currentItem } = useMemo(
    () => getPronunciationDeckView(data, index),
    [data, index],
  );
  const {
    playAudio,
    audioError,
    loading: audioLoading,
  } = useAudioManager(currentItem?.audio ?? null);
  const audioDisabled = getPronunciationAudioDisabled(currentItem, audioError);

  useEffect(() => {
    return schedulePronunciationAudio(audioDisabled, audioLoading, playAudio);
  }, [audioDisabled, audioLoading, currentItem, playAudio]);

  const next = useCallback(async () => {
    await advancePronunciationDeck(currentItem, entries.length, index, setIndex, reload);
  }, [currentItem, entries.length, index, reload]);

  const handleSelectionChange = useCallback(
    (selected: boolean) => {
      handlePronunciationSelectionChange(selected, userId, setIndex, reload);
    },
    [reload, userId],
  );

  const display = getPronunciationDisplay(entries, currentEntry, currentItem, index);
  return {
    currentItem,
    note: display.note,
    grammar: display.grammar,
    loading,
    error,
    audioDisabled,
    audioError,
    audioLoading,
    czech: display.czech,
    english: display.english,
    playAudio,
    pronunciation: display.pronunciation,
    progressLabel: display.progressLabel,
    canGoNext: display.canGoNext,
    handleSelectionChange,
    next,
  };
}
