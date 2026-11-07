import { runProgressReset } from '@/features/practice/run-progress-reset';
import OverviewCard from '@/components/UI/OverviewCard';
import StackedList from '@/components/UI/StackedList';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListButton } from '@/components/UI/buttons/ListButton';
import type { GrammarGroupWithChunks } from '@/database/state/data-types';
import UserItem from '@/database/models/user-items';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { DataState } from '@/components/UI/DataState';
import GrammarDetailCard from './GrammarDetailCard';
import { ROUTES } from '@/config/routes.config';
import { useRouteClose } from '@/routing/use-route-close';
import type { ReviewDirection } from '@/types/practice.types';
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';

type GrammarSelection = Readonly<Pick<GrammarGroupWithChunks, 'id'>>;

export default function GrammarOverview(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const { data, loading, error } = useCurrentUserDataPackage(userId, { kind: 'grammar-overview' });
  const closeRoute = useRouteClose(ROUTES.overviews);
  const [selection, setSelection] = useState<GrammarSelection | null>(null);
  const [unpackedTopicId, setUnpackedTopicId] = useState<number | null>(null);
  const grammarList = data ?? [];
  const hasData = grammarList.length > 0;
  const currentItem = useMemo(() => {
    if (!selection) return null;

    for (const topic of grammarList) {
      const group = topic.groups.find((candidate) => candidate.id === selection.id);
      if (group) return group;
    }

    return null;
  }, [grammarList, selection]);

  useEffect(() => {
    if (selection && !currentItem) setSelection(null);
  }, [currentItem, selection]);

  useQueryErrorToast(error, 'Failed to fetch grammar overview');

  const handleTopicClick = useCallback((topicId: number) => {
    setUnpackedTopicId((currentId) => (currentId === topicId ? null : topicId));
  }, []);

  const handleGroupClick = useCallback((topicId: number, groupId: number) => {
    setUnpackedTopicId(topicId);
    setSelection({ id: groupId });
  }, []);

  const handleReset = useCallback(
    async (grammarGroupId: number, direction: ReviewDirection) => {
      if (!userId) return;
      await runProgressReset(
        userId,
        () => UserItem.resetItemsByGrammarGroupId(userId, grammarGroupId, direction),
        {
          successLog: (resetCount) =>
            `Grammar ${grammarGroupId} ${direction} reset completed: ${resetCount} items reset.`,
          errorContext: 'Failed to reset grammar progress',
        },
      );
    },
    [userId],
  );

  // -- List view --
  if (currentItem === null) {
    return (
      <OverviewCard buttonTitle={TEXTS.grammarOverview} loading={loading} onClose={closeRoute}>
        <DataState
          loading={loading}
          hasData={hasData}
          noDataMessage={error ? TEXTS.loadingError : TEXTS.noGrammar}
        >
          <StackedList>
            {grammarList.map((topic) => {
              const isUnpacked = unpackedTopicId === topic.id;

              return (
                <div key={topic.id} className="flex flex-col gap-1">
                  <ListButton
                    className="flex justify-start p-4 text-left"
                    onClick={() => handleTopicClick(topic.id)}
                    aria-expanded={isUnpacked}
                    title={topic.name}
                  >
                    <p className="overflow-hidden text-ellipsis whitespace-nowrap">{topic.name}</p>
                  </ListButton>
                  {isUnpacked && (
                    <div className="flex flex-col gap-1">
                      {topic.groups.map((group) => (
                        <ListButton
                          key={group.id}
                          className="flex justify-start px-8 text-left"
                          onClick={() => handleGroupClick(topic.id, group.id)}
                          title={group.name}
                        >
                          <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                            {group.name}
                          </p>
                        </ListButton>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </StackedList>
        </DataState>
      </OverviewCard>
    );
  }

  return (
    <GrammarDetailCard
      grammar={currentItem}
      onClose={() => setSelection(null)}
      onReset={handleReset}
    />
  );
}
