import config from '@/config/config';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { compareCzechStrings, filterSortedWords, type DisplayField } from './vocabulary.utils';
import { useLocalStorageSync } from '@/hooks/use-local-storage-sync';
import { useDataManager } from '@/database/state/data-store';
import { selectVocabulary } from '@/database/state/data-selectors';

const INITIAL_VISIBLE_COUNT = config.vocabulary.itemsPerBatch;
const SEARCH_KEY = 'vocabulary_search_term';
const DISPLAY_FIELD_KEY = 'vocabulary_display_field';

/**
 * Custom hook to manage vocabulary state and actions.
 * @param userId - The ID of the user for whom to fetch vocabulary items.
 * @returns An object containing vocabulary state and actions.
 */
export function useVocabulary(userId: string | null) {
  const state = useDataManager((current) => current);
  const words = useMemo(() => userId ? selectVocabulary(state, userId) : [], [state, userId]);
  const loading = Boolean(userId) &&
    (state.userId !== userId || state.status === 'idle' || state.status === 'loading');
  const error = state.userId === userId && state.status === 'error' ? state.error : null;

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchTerm, setSearchTerm] = useLocalStorageSync<string>(`${SEARCH_KEY}_${userId}`, '');
  const [displayField, setDisplayField] = useLocalStorageSync<DisplayField>(
    `${DISPLAY_FIELD_KEY}_${userId}`,
    'english',
  );
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const selectedWord = useMemo(
    () => words.find((word) => word.item_id === selectedWordId) ?? null,
    [selectedWordId, words],
  );
  const setSelectedWord = useCallback((word: UserItemLocal | null) => {
    setSelectedWordId(word?.item_id ?? null);
  }, []);

  useEffect(() => {
    if (selectedWordId !== null && selectedWord === null) setSelectedWordId(null);
  }, [selectedWord, selectedWordId]);

  const sortedByEnglish = useMemo(() => {
    const result = [...words];
    result.sort((a, b) => a.english.toLowerCase().localeCompare(b.english.toLowerCase()));
    return result;
  }, [words]);

  const sortedByCzech = useMemo(
    () =>
      [...words].sort((a, b) => {
        const valA = a.czech?.toLowerCase() || '';
        const valB = b.czech?.toLowerCase() || '';
        return compareCzechStrings(valA, valB);
      }),
    [words],
  );

  const sortedWords = displayField === 'czech' ? sortedByCzech : sortedByEnglish;
  const filteredWords = useMemo(
    () => filterSortedWords(sortedWords, searchTerm, displayField, visibleCount + 1),
    [sortedWords, searchTerm, displayField, visibleCount],
  );

  return {
    loading,
    error,
    visibleCount,
    setVisibleCount,
    searchTerm,
    setSearchTerm,
    displayField,
    setDisplayField,
    selectedWord,
    setSelectedWord,
    filteredWords,
  };
}
