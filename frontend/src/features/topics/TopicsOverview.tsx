import { TEXTS } from '@/locales/cs';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import OverviewCard from '@/components/UI/OverviewCard';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useDataPackage } from '@/database/state/data-store';

export default function TopicsOverview() {
  const closeRoute = useRouteClose(ROUTES.overviews);
  const userId = useAuthStore((state) => state.userId);
  const packageState = useDataPackage({ kind: 'topics-overview' });
  const hasUserPackage = packageState.userId === userId;
  const topics = hasUserPackage ? packageState.data ?? [] : [];
  const topicsLoading = Boolean(userId) && (!hasUserPackage || packageState.status === 'loading');
  const topicsError = hasUserPackage && packageState.status === 'error' ? packageState.error : null;
  const hasTopics = topics.length > 0;

  useQueryErrorToast(topicsError, 'Failed to fetch topics overview');

  return (
    <OverviewCard buttonTitle={TEXTS.topicsOverview} onClose={closeRoute}>
      <DataState loading={topicsLoading} hasData={hasTopics} noDataMessage={TEXTS.noTopics}>
        <StackedList>
          {topics.map((topic) => (
            <NavigationButton
              key={topic.id}
              className="h-input flex w-full justify-start px-4 text-left"
              to={`${ROUTES.topics}/${topic.id}`}
              title={topic.name}
            >
              <p className="overflow-hidden text-ellipsis whitespace-nowrap">{topic.name}</p>
            </NavigationButton>
          ))}
        </StackedList>
      </DataState>
    </OverviewCard>
  );
}

