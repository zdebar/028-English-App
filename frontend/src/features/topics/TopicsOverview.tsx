import { TEXTS } from '@/locales/cs';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '../auth/use-auth-store';
import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import OverviewCard from '@/components/UI/OverviewCard';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';

export default function TopicsOverview() {
  const closeRoute = useRouteClose(ROUTES.overviews);
  const userId = useAuthStore((state) => state.userId);
  const { data, loading: topicsLoading, error: topicsError } = useCurrentUserDataPackage(
    userId,
    { kind: 'topics-overview' },
  );
  const topics = data ?? [];
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

