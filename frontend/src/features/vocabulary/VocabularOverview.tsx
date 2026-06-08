import DelayedNotification from '@/components/UI/DelayedNotification';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useVocabulary } from './use-vocabulary';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';

/**
 * VocabularyOverview component
 *
 * @returns The vocabulary overview UI with list and detail card functionality.
 */
export default function VocabularyOverview() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  const {
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
  } = useVocabulary(userId);

  // -- HANDLERS  --
  const handleResetUserItem = useCallback(async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId !== 'number' || !userId) {
      return;
    }

    try {
      const resetItemId = await UserItem.resetItemById(userId, itemId);
      reportInfo(`Vocabulary item reset completed: item ${resetItemId}.`);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
      setSelectedWord(null);
      reload();
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError('Reset User Item Error', error);
    }
  }, [selectedWord, userId, reload, showToast]);

  const handleSelectWord = useCallback(
    (index: number) => {
      if (index < 0 || index >= filteredWords.length) {
        return;
      }

      setSelectedWord(filteredWords[index]);
    },
    [filteredWords, setSelectedWord],
  );

  if (loading) {
    return <DelayedNotification />;
  }

  if (selectedWord === null) {
    return (
      <VocabularyList
        filteredWords={filteredWords}
        visibleCount={visibleCount}
        displayField={displayField}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setDisplayField={setDisplayField}
        setVisibleCount={setVisibleCount}
        onSelect={handleSelectWord}
        onClose={() => navigate('/profile')}
      />
    );
  }

  return (
    <VocabularyDetailCard
      selectedWord={selectedWord}
      selectedTitle={
        displayField === 'czech' ? (selectedWord.czech ?? '') : (selectedWord.english ?? '')
      }
      onClose={() => setSelectedWord(null)}
      onReset={handleResetUserItem}
    />
  );
}
