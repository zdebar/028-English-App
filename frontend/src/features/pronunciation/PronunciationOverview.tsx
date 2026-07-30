import { DataState } from '@/components/UI/DataState';
import OverviewCard from '@/components/UI/OverviewCard';
import { ListButton } from '@/components/UI/buttons/ListButton';
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

export default function PronunciationOverview() {
  const userId = useAuthStore((state) => state.userId);
  const showToast = useToastStore((state) => state.showToast);
  const navigate = useNavigate();
  const fetchGroups = useCallback(
    () => (userId ? PronunciationGroup.getOverview(userId) : Promise.resolve([])),
    [userId],
  );
  const { data, loading, hasData, error } = useArray(fetchGroups);

  useEffect(() => {
    if (!error) return;
    showToast(TEXTS.loadingError, 'error');
    reportError('Failed to fetch pronunciation overview', error);
  }, [error, showToast]);

  return (
    <OverviewCard
      buttonTitle={TEXTS.pronunciationOverview}
      onClose={() => navigate(ROUTES.profile)}
    >
      <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noPronunciationGroups}>
        {data.map((group) => (
          <ListButton
            key={group.id}
            className="px-4"
            title={group.name}
            onClick={() =>
              navigate(ROUTES.pronunciationGroup.replace(':groupId', String(group.id)))
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
          </ListButton>
        ))}
        <HelpText className="top-20 right-2">{TEXTS.pronunciationStartedHelp}</HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      </DataState>
    </OverviewCard>
  );
}
