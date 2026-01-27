import OverviewCard from '@/components/UI/OverviewCard';
import { TEXTS } from '@/config/texts';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { useFetch } from '@/hooks/use-fetch';
import type { GrammarLocal } from '@/types/local.types';
import DOMPurify from 'dompurify';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListOverview from './ListOverview';

/**
 * GrammarOverview component displays a list of started grammar topics for the user.
 *
 * @returns A view with a grammar list and detail card, including progress reset and help features.
 */
export default function GrammarOverview() {
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  const fetchGrammarList = useCallback(async () => {
    if (userId) {
      return await Grammar.getStartedGrammarList(userId);
    }
    return [];
  }, [userId]);

  const {
    data: grammarArray,
    error,
    loading,
    setShouldReload,
  } = useFetch<GrammarLocal[]>(fetchGrammarList);

  const currentGrammar = grammarArray?.[currentIndex];

  const handleClearGrammarUserItems = async () => {
    const grammarId = currentGrammar?.id;
    if (typeof grammarId === 'number' && userId) {
      await UserItem.resetGrammarItems(userId, grammarId);
      setShouldReload(true);
    }
  };

  return (
    <>
      {!cardVisible ? (
        <ListOverview
          listTitle={TEXTS.grammarOverview}
          emptyTitle={TEXTS.noStartedGrammar}
          array={grammarArray}
          loading={loading}
          error={error}
          onSelect={(index) => {
            setCurrentIndex(index);
            setCardVisible(true);
          }}
          onClose={() => navigate('/profile')}
        />
      ) : (
        <OverviewCard
          titleText={currentGrammar?.name ?? TEXTS.grammarOverview}
          onClose={() => setCardVisible(false)}
          handleReset={handleClearGrammarUserItems}
          className="relative"
        >
          {currentGrammar?.note ? (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(currentGrammar?.note ?? ''),
              }}
            />
          ) : (
            TEXTS.noNotesToDisplay
          )}
          <HelpButton className="right-3.5 bottom-3.5" />
        </OverviewCard>
      )}
    </>
  );
}
