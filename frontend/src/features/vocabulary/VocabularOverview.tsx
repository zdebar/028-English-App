import { useAuthStore } from '@/features/auth/use-auth-store';
import UserItem from '@/database/models/user-items';
import { useCallback } from 'react';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';
import { useNavigate } from 'react-router-dom';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '../toast/use-toast-store';
import { errorHandler } from '../logging/error-handler';
import DelayedNotification from '@/components/UI/DelayedNotification';
import { useVocabulary } from './use-vocabulary';

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
  const handleClearUserItem = useCallback(async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId !== 'number' || !userId) return;
    try {
      await UserItem.resetItemById(userId, itemId);
      setSelectedWord(null);
      reload();
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (error) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      errorHandler('Reset User Item Error', error);
    }
  }, [selectedWord, userId, reload, showToast]);

  const handleSelectWord = useCallback(
    (index: number) => {
      if (index < 0 || index >= filteredWords.length) return;
      setSelectedWord(filteredWords[index]);
    },
    [filteredWords],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleCloseList = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  if (loading) {
    return <DelayedNotification />;
  }

  return (
    <>
      {selectedWord === null ? (
        <VocabularyList
          filteredWords={filteredWords}
          visibleCount={visibleCount}
          displayField={displayField}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setDisplayField={setDisplayField}
          setVisibleCount={setVisibleCount}
          onSelect={handleSelectWord}
          onClose={handleCloseList}
        />
      ) : (
        <VocabularyDetailCard
          selectedWord={selectedWord}
          selectedTitle={
            displayField === 'czech' ? (selectedWord.czech ?? '') : (selectedWord.english ?? '')
          }
          onClose={handleCloseDetail}
          onReset={handleClearUserItem}
        />
      )}
    </>
  );
}
