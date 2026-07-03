import OverviewCard from '@/components/UI/OverviewCard';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListButton } from '@/components/UI/buttons/ListButton';
import { useArray } from '@/hooks/use-array';
import Grammar from '@/database/models/grammar';
import type { GrammarType } from '@/types/generic.types';
import UserItem from '@/database/models/user-items';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { DataState } from '@/components/UI/DataState';
import GrammarDetailCard from './GrammarDetailCard';

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
    if (!userId) {
      return [];
    }

    return Grammar.getStarted(userId);
  }, [userId]);

  const {
    data: grammarList,
    currentIndex,
    setCurrentIndex,
    currentItem,
    loading,
    hasData,
    error,
    reload,
  } = useArray<GrammarType>(fetchGrammar);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch grammar overview', error);
  }, [error, showToast]);

  const handleReset = useCallback(async () => {
    if (!currentItem || !userId) {
      return;
    }

    try {
      const resetCount = await UserItem.resetItemsByGrammarId(userId, currentItem.id);
      reportInfo(`Grammar ${currentItem.id} reset completed: ${resetCount} items reset.`);
      reload();
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (err) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError('Failed to reset grammar progress', err);
    }
  }, [currentItem, showToast, userId]);

  // -- List view --
  if (currentIndex === null) {
    return (
      <OverviewCard
        buttonTitle={TEXTS.grammarOverview}
        loading={loading}
        onClose={() => navigate('/profile')}
      >
        <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noGrammar}>
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

  return (
    <GrammarDetailCard
      grammar={currentItem}
      onClose={() => setCurrentIndex(null)}
      onReset={handleReset}
    />
  );
}
