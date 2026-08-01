import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { useArray } from '@/hooks/use-array';
import { TEXTS } from '@/locales/cs';
import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PronunciationGroupOverviewType } from '@/types/pronunciation.types';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { pronunciationGroupDetailDescriptor } from '@/routing/route-data';

export default function PronunciationOverview({
  initialGroups,
}: Readonly<{ initialGroups?: PronunciationGroupOverviewType[] }>) {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const fetchGroups = useCallback(
    () => (userId ? PronunciationGroup.getOverview(userId) : Promise.resolve([])),
    [userId],
  );
  const { data, loading, hasData, error } = useArray(fetchGroups, {
    initialData: initialGroups,
  });

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch pronunciation overview', error);
  }, [error, showToast]);

  return (
    <OverviewCard
      buttonTitle={TEXTS.pronunciationGroups}
      onClose={() => navigate(ROUTES.overviews)}
    >
      <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noPronunciationGroups}>
        {data.map((group) => (
          <PrefetchButton
            key={group.id}
            className="h-input w-full grow-0 preserve-disabled-text-color px-4"
            title={group.name}
            to={ROUTES.pronunciationGroup.replace(':groupId', String(group.id))}
            descriptor={
              userId ? pronunciationGroupDetailDescriptor(userId, group.id) : undefined
            }
          >
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <div className="min-w-0 text-left">
                <p className="overflow-hidden font-bold text-ellipsis whitespace-nowrap">
                  {group.name}
                </p>
                <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                  {group.examples.join(', ')}
                </p>
              </div>
              <span className="shrink-0 text-sm">
                {group.started_count}/{group.total_count}
              </span>
            </div>
          </PrefetchButton>
        ))}
        <HelpText className="top-20 right-2">{TEXTS.pronunciationStartedHelp}</HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      </DataState>
    </OverviewCard>
  );
}
