import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useArray } from '@/hooks/use-array';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useMemo, useState } from 'react';
import { compareCzechStrings, filterSortedWords, type DisplayField } from './vocabulary.utils';

const INITIAL_VISIBLE_COUNT = config.vocabulary.itemsPerPage;

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
  const [searchTerm, setSearchTerm] = useState('');
  const [displayField, setDisplayField] = useState<DisplayField>('english');
  const [selectedWord, setSelectedWord] = useState<UserItemLocal | null>(null);

  const sortedByEnglish = useMemo(() => words, [words]);
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
