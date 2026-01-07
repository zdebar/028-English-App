import { useState, useEffect, useCallback } from 'react';
import UserItem from '@/database/models/user-items';
import type { UserItemLocal } from '@/types/local.types';
import { useFetch } from '@/hooks/use-fetch';
import { useAuthStore } from '@/features/auth/use-auth-store';
import Loading from '@/components/UI/Loading';
import VocabularyList from './VocabularyList';
import VocabularyDetailCard from './VocabularyDetailCard';

export default function VocabularyOverview() {
  const { userId } = useAuthStore();

  const fetchVocabulary = useCallback(async () => {
    if (userId) {
      return await UserItem.getUserStartedVocabulary(userId);
    }
    return [];
  }, [userId]);

  const {
    data: words,
    error,
    loading,
    setShouldReload,
  } = useFetch<UserItemLocal[]>(fetchVocabulary);

  const [filteredWords, setFilteredWords] = useState<UserItemLocal[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayField, setDisplayField] = useState<'czech' | 'english'>('czech');
  const selectedWord = filteredWords ? filteredWords[currentIndex] : null;

  useEffect(() => {
    if (!words) return;
    const filtered = words
      .filter((item) => item[displayField]?.toLowerCase().startsWith(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const lengthDiff = a[displayField]?.length - b[displayField].length;
        if (lengthDiff !== 0) return lengthDiff;
        return a[displayField].localeCompare(b[displayField]);
      });
    setFilteredWords(filtered);
  }, [words, searchTerm, displayField]);

  const handleClearUserItem = async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId === 'number' && userId) {
      await UserItem.resetUserItemById(userId, itemId);
      setShouldReload(true);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {!cardVisible ? (
        <VocabularyList
          filteredWords={filteredWords}
          visibleCount={visibleCount}
          displayField={displayField}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setDisplayField={setDisplayField}
          setVisibleCount={setVisibleCount}
          onSelect={(index) => {
            setCurrentIndex(index);
            setCardVisible(true);
          }}
          error={error}
          onClose={() => window.history.back()}
        />
      ) : (
        <VocabularyDetailCard
          selectedWord={selectedWord}
          onClose={() => setCardVisible(false)}
          onReset={handleClearUserItem}
        />
      )}
    </>
  );
}
