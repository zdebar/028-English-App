import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useArray } from '@/hooks/use-array';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useMemo, useState } from 'react';
import { compareCzechStrings, filterSortedWords, type DisplayField } from './vocabulary.utils';
import { useLocalStorageSync } from '@/hooks/user-local-storage-sync';

const INITIAL_VISIBLE_COUNT = config.vocabulary.itemsPerPage;
const SEARCH_KEY = 'vocabulary_search_term';
const DISPLAY_FIELD_KEY = 'vocabulary_display_field';

/**
 * Custom hook to manage vocabulary state and actions.
 * @param userId - The ID of the user for whom to fetch vocabulary items.
 * @returns An object containing vocabulary state and actions.
 */
export function useVocabulary(userId: string | null) {
  const fetchVocabulary = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getStartedVocabulary(userId);
  }, [userId]);

  const { data: words, loading, reload } = useArray<UserItemLocal>(fetchVocabulary);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchTerm, setSearchTerm] = useLocalStorageSync<string>(`${SEARCH_KEY}_${userId}`, '');
  const [displayField, setDisplayField] = useLocalStorageSync<DisplayField>(
    `${DISPLAY_FIELD_KEY}_${userId}`,
    'english',
  );
  const [selectedWord, setSelectedWord] = useState<UserItemLocal | null>(null);

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
    reload,
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
