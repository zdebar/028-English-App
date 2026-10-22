import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { runProgressReset } from '@/features/practice/run-progress-reset';
import { useVocabulary } from './use-vocabulary';
import { useCallback } from 'react';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';
import { ROUTES } from '@/config/routes.config';
import type { UserItemLocal } from '@/types/user-item.types';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';

/**
 * VocabularyOverview component
 *
 * @returns The vocabulary overview UI with list and detail card functionality.
 */
export default function VocabularyOverview({
  initialWords,
}: Readonly<{ initialWords?: UserItemLocal[] }>) {
  const userId = useAuthStore((state) => state.userId);
  const closeRoute = useRouteClose(ROUTES.overviews);

  const {
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
  } = useVocabulary(userId, initialWords);

  useQueryErrorToast(error, 'Failed to fetch vocabulary overview');

  // -- HANDLERS  --
  const handleResetUserItem = useCallback(async (direction: 'cz_to_en' | 'en_to_cz' = 'cz_to_en') => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId !== 'number' || !userId) {
      return;
    }
    await runProgressReset(
      userId,
      () => UserItem.resetItemById(userId, itemId, new Date().toISOString(), direction),
      {
        successLog: (resetItemId) => `Vocabulary item reset completed: item ${resetItemId}.`,
        errorContext: 'Reset User Item Error',
      },
    );
  }, [selectedWord, userId]);

  const handleSelectWord = useCallback(
    (index: number) => {
      if (index < 0 || index >= filteredWords.length) {
        return;
      }

      setSelectedWord(filteredWords[index]);
    },
    [filteredWords, setSelectedWord],
  );

  if (selectedWord === null) {
    return (
      <VocabularyList
        filteredWords={filteredWords}
        loading={loading}
        visibleCount={visibleCount}
        displayField={displayField}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={handleSelectWord}
        onClose={closeRoute}
      />
    );
  }

  return (
    <VocabularyDetailCard
      selectedWord={selectedWord}
      onClose={() => setSelectedWord(null)}
      onReset={handleResetUserItem}
    />
  );
}
