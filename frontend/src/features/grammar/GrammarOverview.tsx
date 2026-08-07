import OverviewCard from '@/components/UI/OverviewCard';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListButton } from '@/components/UI/buttons/ListButton';
import { useArray } from '@/hooks/use-array';
import GrammarGroup, {
  type GrammarOverviewEntry,
} from '@/database/models/grammar-groups';
import UserItem from '@/database/models/user-items';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { DataState } from '@/components/UI/DataState';
import GrammarDetailCard from './GrammarDetailCard';
import { ROUTES } from '@/config/routes.config';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-cache';

export default function GrammarOverview({
  initialGrammar,
}: Readonly<{ initialGrammar?: GrammarOverviewEntry[] }>): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);

  const fetchGrammar = useCallback(async () => {
    if (!userId) {
      return [];
    }

    return GrammarGroup.getStarted(userId);
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
  } = useArray<GrammarOverviewEntry>(fetchGrammar, { initialData: initialGrammar });

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
      let resetCount: number;
      if (currentItem.kind === 'chunk') {
        resetCount = await UserItem.resetItemsByGrammarChunkId(userId, currentItem.id);
      } else {
        resetCount = await UserItem.resetItemsByGrammarGroupId(userId, currentItem.id);
      }
      reportInfo(`Grammar ${currentItem.id} reset completed: ${resetCount} items reset.`);
      invalidateRouteData(routeDataKey('grammar', userId));
      reload();
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (err) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError('Failed to reset grammar progress', err);
    }
  }, [currentItem, reload, showToast, userId]);

  // -- List view --
  if (currentIndex === null) {
    return (
      <OverviewCard
        buttonTitle={TEXTS.grammarOverview}
        loading={loading}
        onClose={() => navigate(ROUTES.overviews)}
      >
        <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noGrammar}>
          {grammarList.map((item, index) => (
            <ListButton
              key={`${item.kind}-${item.id}`}
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
      showHelpButton
    />
  );
}
