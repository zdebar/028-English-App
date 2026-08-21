import OverviewCard from '@/components/UI/OverviewCard';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListButton } from '@/components/UI/buttons/ListButton';
import GrammarGroup, {
  type GrammarGroupWithChunks,
} from '@/database/models/grammar-groups';
import UserItem from '@/database/models/user-items';
import { reportError, reportInfo } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { DataState } from '@/components/UI/DataState';
import GrammarDetailCard from './GrammarDetailCard';
import { ROUTES } from '@/config/routes.config';
import { invalidateRouteData, routeDataKey } from '@/routing/route-data-handoff';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { useRouteClose } from '@/routing/use-route-close';

type GrammarSelection = Readonly<Pick<GrammarGroupWithChunks, 'id'>>;

export default function GrammarOverview({
  initialGrammar,
}: Readonly<{ initialGrammar?: GrammarGroupWithChunks[] }>): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const closeRoute = useRouteClose(ROUTES.overviews);
  const showToast = useToastStore((state) => state.showToast);
  const [selection, setSelection] = useState<GrammarSelection | null>(null);

  const fetchGrammar = useCallback(async () => {
    if (!userId) {
      return [];
    }

    return GrammarGroup.getStarted(userId);
  }, [userId]);

  const { data: grammarList, loading, error } = useLiveQueryData(fetchGrammar, {
    emptyData: [],
    initialData: initialGrammar,
  });
  const hasData = grammarList.length > 0;
  const currentItem = useMemo(
    () =>
      selection ? (grammarList.find((item) => item.id === selection.id) ?? null) : null,
    [grammarList, selection],
  );

  useEffect(() => {
    if (selection && !currentItem) setSelection(null);
  }, [currentItem, selection]);

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
      const resetCount = await UserItem.resetItemsByGrammarGroupId(userId, currentItem.id);
      reportInfo(`Grammar ${currentItem.id} reset completed: ${resetCount} items reset.`);
      invalidateRouteData(routeDataKey('grammar', userId));
      showToast(TEXTS.resetProgressSuccessToast, 'success');
    } catch (err) {
      showToast(TEXTS.resetProgressErrorToast, 'error');
      reportError('Failed to reset grammar progress', err);
    }
  }, [currentItem, showToast, userId]);

  // -- List view --
  if (currentItem === null) {
    return (
      <OverviewCard
        buttonTitle={TEXTS.grammarOverview}
        loading={loading}
        onClose={closeRoute}
      >
        <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noGrammar}>
          <div className="flex flex-col gap-1 pt-1">
            {grammarList.map((item) => (
              <ListButton
                key={item.id}
                className="h-input justify-start px-4"
                onClick={() => setSelection({ id: item.id })}
                title={item.name}
              >
                {item.name}
              </ListButton>
            ))}
          </div>
        </DataState>
      </OverviewCard>
    );
  }

  return (
    <GrammarDetailCard
      grammar={currentItem}
      onClose={() => setSelection(null)}
      onReset={handleReset}
      showHelpButton
    />
  );
}
