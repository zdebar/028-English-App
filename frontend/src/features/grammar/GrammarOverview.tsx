import OverviewCard from '@/components/UI/OverviewCard';
import Grammar from '@/database/models/grammar';
import UserItem from '@/database/models/user-items';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useFetch } from '@/hooks/use-fetch';
import { TEXTS } from '@/locales/cs';
import type { GrammarLocal } from '@/types/local.types';
import DOMPurify from 'dompurify';
import { useCallback, useEffect, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import CloseButton from '@/components/UI/buttons/CloseButton';

/**
 * GrammarOverview component displays a list of started grammar topics for the user.
 *
 * @returns {JSX.Element} A view with a grammar list and detail card, including progress reset and help features.
 * @throws Doesn't throw errors; displays toast messages on failures.
 */
export default function GrammarOverview(): JSX.Element {
  const [cardVisible, setCardVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();

  // Fetch grammar list for the user
  const fetchGrammarList = useCallback(async () => {
    if (!userId) return null;
    return await Grammar.getStartedGrammarList(userId);
  }, [userId]);

  const { data: grammarArray, error, reload } = useFetch<GrammarLocal[] | null>(fetchGrammarList);

  useEffect(() => {
    if (error) {
      showToast(TEXTS.dataLoadingError, 'error');
    }
  }, [error, showToast]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [grammarArray]);

  const currentGrammar = grammarArray?.[currentIndex] ?? null;

  // Handler to clear user items for the current grammar topic
  const handleClearGrammarUserItems = async () => {
    try {
      const grammarId = currentGrammar?.id;
      if (typeof grammarId === 'number' && userId) {
        await UserItem.resetGrammarItems(userId, grammarId);
        reload();
      }
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch {
      showToast(TEXTS.resetProgressErrorToast, 'error');
    }
  };

  // List view
  if (!cardVisible) {
    return (
      <div className={`card-width flex flex-col justify-start gap-1`}>
        <div className="h-button flex items-center justify-between gap-1">
          <div className="h-button flex grow justify-start p-4">{TEXTS.grammarOverview}</div>
          <CloseButton onClick={() => navigate('/profile')} />
        </div>
        {grammarArray && grammarArray.length > 0 ? (
          grammarArray.map((item, index) => (
            <ButtonRectangular
              key={item.id}
              className="h-input flex grow-0 justify-start p-4 text-left"
              onClick={() => {
                setCurrentIndex(index);
                setCardVisible(true);
              }}
            >
              {`${index + 1} : ${item.name} `}
            </ButtonRectangular>
          ))
        ) : (
          <p className="p-4">{TEXTS.noGrammar}</p>
        )}
      </div>
    );
  }

  // GrammarCard view
  return (
    <OverviewCard
      titleText={currentGrammar?.name ?? TEXTS.grammarOverview}
      onClose={() => setCardVisible(false)}
      handleReset={handleClearGrammarUserItems}
      className="relative"
    >
      {(currentGrammar?.note ? (
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(currentGrammar?.note ?? ''),
          }}
        />
      ) : (
        TEXTS.notAvailable
      )) ?? TEXTS.notAvailable}
      <HelpButton className="right-3.5 bottom-3.5" />
    </OverviewCard>
  );
}
