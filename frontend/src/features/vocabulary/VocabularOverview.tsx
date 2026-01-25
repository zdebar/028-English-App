import Loading from '@/components/UI/Loading';
import config from '@/config/config';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useFetch } from '@/hooks/use-fetch';
import type { UserItemLocal } from '@/types/local.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import VocabularyDetailCard from './VocabularyDetailCard';
import VocabularyList from './VocabularyList';
import { useNavigate } from 'react-router-dom';

/**
 * VocabularyOverview component
 *
 * @returns The vocabulary overview UI with list and detail card functionality.
 */
export default function VocabularyOverview() {
  const { userId } = useAuthStore();
  const navigate = useNavigate();

  const fetchVocabulary = useCallback(async () => {
    if (!userId) return [];
    return UserItem.getUserStartedVocabulary(userId);
  }, [userId]);

  const {
    data: words,
    error,
    loading,
    setShouldReload,
  } = useFetch<UserItemLocal[]>(fetchVocabulary);

  const [visibleCount, setVisibleCount] = useState(config.vocabulary.itemsPerPage);
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayField, setDisplayField] = useState<'czech' | 'english'>('czech');

  const filteredWords = useMemo(() => {
    if (!words) return [];

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedWords = words
      .filter((item) => {
        const value = (item[displayField] ?? '').toLowerCase();
        return normalizedSearch.length === 0 ? true : value.startsWith(normalizedSearch);
      })
      .sort((a, b) => {
        const aValue = a[displayField] ?? '';
        const bValue = b[displayField] ?? '';

        const lengthDiff = aValue.length - bValue.length;
        if (lengthDiff !== 0) return lengthDiff;
        return aValue.localeCompare(bValue);
      });

    return normalizedWords;
  }, [words, searchTerm, displayField]);

  const selectedWord =
    currentIndex >= 0 && currentIndex < filteredWords.length ? filteredWords[currentIndex] : null;

  useEffect(() => {
    setVisibleCount(config.vocabulary.itemsPerPage);
    setCurrentIndex(0);
  }, [searchTerm, displayField]);

  useEffect(() => {
    if (!cardVisible) return;
    if (!selectedWord) {
      setCardVisible(false);
      setCurrentIndex(0);
    }
  }, [cardVisible, selectedWord]);

  const handleClearUserItem = async () => {
    const itemId = selectedWord?.item_id;
    if (typeof itemId === 'number' && userId) {
      await UserItem.resetUserItemById(userId, itemId);
      setShouldReload(true);
      setCardVisible(false);
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
          onClose={() => navigate('/profile')}
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
