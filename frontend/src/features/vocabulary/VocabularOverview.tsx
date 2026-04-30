import Delayed from '@/components/UI/DelayedMessage';
import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useMemo, useState } from 'react';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';
import { useNavigate } from 'react-router-dom';
import { useArray } from '@/hooks/use-array';
import { compareCzechStrings, type DisplayField } from './vocabulary.utils';
import Notification from '@/components/UI/Notification';
import { TEXTS } from '@/locales/cs';
import { filterSortedWords } from './vocabulary.utils';
import { useToastStore } from '../toast/use-toast-store';
import { errorHandler } from '../logging/error-handler';

const INITIAL_VISIBLE_COUNT = config.vocabulary.itemsPerPage;

/**
 * VocabularyOverview component
 *
 * @returns The vocabulary overview UI with list and detail card functionality.
 */
export default function VocabularyOverview() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  // -- DATA FETCHING --
  const fetchVocabulary = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getStartedVocabulary(userId);
  }, [userId]);

  const { data: words, error, loading, reload } = useArray<UserItemLocal>(fetchVocabulary);

  // -- WORDS FILTERING --
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
    return (
      <Delayed>
        <Notification className="color-info pt-4">{TEXTS.loadingMessage}</Notification>
      </Delayed>
    );
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
          error={error}
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
