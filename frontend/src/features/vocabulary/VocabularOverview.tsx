import DelayedMessage from '@/components/UI/DelayedMessage';
import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import type { UserItemLocal } from '@/types/local.types';
import { useCallback, useMemo, useState } from 'react';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';
import { useNavigate } from 'react-router-dom';
import { useArray } from '@/hooks/use-array';
import type { DisplayField } from './vocabulary.utils';
import NotificationText from '@/components/UI/NotificationText';
import { TEXTS } from '@/locales/cs';
import { filterSortedWords } from './vocabulary.utils';

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

  const { data: words, error, loading, reload } = useArray<UserItemLocal>(fetchVocabulary);

  // -- WORDS FILTERING --
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayField, setDisplayField] = useState<DisplayField>('czech');
  const [selectedWord, setSelectedWord] = useState<UserItemLocal | null>(null);

  const sortedByCzech = useMemo(() => words, [words]);
  const sortedByEnglish = useMemo(
    () =>
      [...words].sort((a, b) => {
        const valA = a.english?.toLowerCase() || '';
        const valB = b.english?.toLowerCase() || '';
        return valA.localeCompare(valB);
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

    await UserItem.resetItemById(userId, itemId);
    setSelectedWord(null);
    void reload();
  }, [selectedWord, userId, reload]);

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
      <DelayedMessage>
        <NotificationText text={TEXTS.loadingMessage} />
      </DelayedMessage>
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
          onClose={handleCloseDetail}
          onReset={handleClearUserItem}
        />
      )}
    </>
  );
}
