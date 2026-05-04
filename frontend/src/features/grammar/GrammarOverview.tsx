import OverviewCard from '@/components/UI/OverviewCard';
import { useAuthStore } from '@/features/auth/use-auth-store';
import HelpButton from '@/features/help/HelpButton';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListButton } from '@/components/UI/buttons/ListButton';
import { useArray } from '@/hooks/use-array';
import Grammar from '@/database/models/grammar';
import type { GrammarType } from '@/types/generic.types';
import UserItem from '@/database/models/user-items';
import { DataState } from '@/components/UI/DataState';
import { useToastStore } from '../toast/use-toast-store';
import { errorHandler } from '../logging/error-handler';

/**
 * GrammarOverview component displays a list of started grammar topics for the user.
 *
 * @returns {JSX.Element} A view with a grammar list and detail card, including progress reset and help features.
 * @throws Doesn't throw errors; displays toast messages on failures.
 */
export default function GrammarOverview(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const fetchGrammar = useCallback(async () => {
    if (!userId) return [];
    try {
      return await Grammar.getStarted(userId);
    } catch (err) {
      showToast(TEXTS.loadingError, 'error');
      errorHandler('Failed to fetch grammar overview', err);
      return [];
    }
  }, [userId]);

  const {
    data: grammarList,
    currentIndex,
    setCurrentIndex,
    currentItem,
    loading,
    hasData,
  } = useArray<GrammarType>(fetchGrammar);

  const handleReset = useCallback(async () => {
    if (!currentItem || !userId) return;
    try {
      await UserItem.resetItemsByGrammarId(userId, currentItem.id);
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (err) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      errorHandler('Failed to reset grammar progress', err);
    }
  }, [currentItem, userId]);

  // -- List view --
  if (currentIndex === null) {
    return (
      <OverviewCard
        buttonTitle={TEXTS.grammarOverview}
        loading={loading}
        onClose={() => navigate('/profile')}
      >
        <DataState loading={loading} hasData={hasData}>
          {grammarList.map((item, index) => (
            <ListButton
              key={item.id}
              className="h-input justify-start px-4"
              onClick={() => setCurrentIndex(index)}
              title={item.name}
            >
              {item.name}
            </ListButton>
          ))}
        </DataState>
      </OverviewCard>
    );
  }

  // -- GrammarCard view --
  return (
    <OverviewCard
      buttonTitle={currentItem?.name}
      modalTitle={TEXTS.restartGrammarTitle}
      modalText={TEXTS.restartGrammarDescription}
      handleReset={handleReset}
      onClose={() => setCurrentIndex(null)}
      className="relative"
    >
      <div dangerouslySetInnerHTML={{ __html: currentItem?.note || '' }} className="p-4" />
      <HelpButton className="right-0 -bottom-10.5" />
    </OverviewCard>
  );
}
