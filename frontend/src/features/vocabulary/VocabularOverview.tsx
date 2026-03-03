import DelayedMessage from '@/components/UI/DelayedMessage';
import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import type { UserItemLocal } from '@/types/local.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';
import { useNavigate } from 'react-router-dom';
import { useArray } from '@/hooks/use-array';
import type { DisplayField } from './vocabulary.utils';
import { filterAndSortWords } from './vocabulary.utils';
import NotificationText from '@/components/UI/NotificationText';
import { TEXTS } from '@/locales/cs';

const INITIAL_VISIBLE_COUNT = config.vocabulary.itemsPerPage;

/**
 * VocabularyOverview component
 *
 * @returns The vocabulary overview UI with list and detail card functionality.
 */
export default function VocabularyOverview() {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  // -- DATA FETCHING --
  const fetchVocabulary = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getStartedVocabulary(userId);
  }, [userId]);

  const {
    data: words,
    currentIndex,
    setCurrentIndex,
    error,
    loading,
    reload,
  } = useArray<UserItemLocal>(fetchVocabulary);

  // -- WORDS FILTERING --
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayField, setDisplayField] = useState<DisplayField>('czech');

  const filteredWords = useMemo(
    () => filterAndSortWords(words, searchTerm, displayField),
    [words, searchTerm, displayField],
  );

  const selectedWord = useMemo(
    () => (currentIndex == null ? null : (filteredWords[currentIndex] ?? null)),
    [currentIndex, filteredWords],
  );

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchTerm, displayField]);

  // -- HANDLERS  --
  const handleClearUserItem = useCallback(async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId !== 'number' || !userId) return;

    await UserItem.resetUserItemById(userId, itemId);
    void reload();
    setCurrentIndex(null);
  }, [selectedWord, userId, reload, setCurrentIndex]);

  const handleSelectWord = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    [setCurrentIndex],
  );

  const handleCloseDetail = useCallback(() => {
    setCurrentIndex(null);
  }, [setCurrentIndex]);

  const handleCloseList = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  if (loading) {
    return (
      <DelayedMessage>
        <NotificationText text={TEXTS.loadingMessage} />
      </DelayedMessage>
    );
  }

  return (
    <>
      {currentIndex === null || !selectedWord ? (
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
          onClose={handleCloseDetail}
          onReset={handleClearUserItem}
        />
      )}
    </>
  );
}
