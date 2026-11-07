import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useAuthStore } from '@/features/auth/use-auth-store';
import type { SoundClass } from '@/types/table.types';
import { useCurrentUserDataPackage } from '@/database/state/use-current-user-data-package';

type ContrastClassPresentation = Readonly<{ key: SoundClass; title: string }>;

const CONTRAST_CLASS_PRESENTATION: readonly ContrastClassPresentation[] = [
  { key: 'vowel', title: TEXTS.pronunciationVowels },
  { key: 'consonant', title: TEXTS.pronunciationConsonants },
];

const CATEGORY_HEADING_CLASS_NAME =
  'h-input border-disabled-light text-light dark:border-disabled-dark dark:text-dark flex w-full items-center justify-start border border-dashed px-4 text-left';

export default function PronunciationOverview() {
  const userId = useAuthStore((state) => state.userId);
  const { data: packageData, loading, error } = useCurrentUserDataPackage(
    userId,
    { kind: 'pronunciation-overview' },
  );
  const closeRoute = useRouteClose(ROUTES.home);
  const data = packageData ?? [];
  const hasData = data.length > 0;

  useQueryErrorToast(error, 'Failed to fetch pronunciation overview');

  return (
    <OverviewCard
      buttonTitle={TEXTS.pronunciationPractice}
      onClose={closeRoute}
      showResetAction={false}
    >
      <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noPronunciationGroups}>
        <StackedList>
          {CONTRAST_CLASS_PRESENTATION.map((category) => (
            <section key={category.title} className="flex flex-col gap-1">
              <div className={CATEGORY_HEADING_CLASS_NAME}>{category.title}</div>
              <div className="grid grid-cols-2 gap-1 min-[480px]:grid-cols-4">
                {data.filter((group) => group.contrast_class === category.key).map((group) => {
                  const contrastName = splitContrastName(group.name);
                  return (
                    <NavigationButton
                      key={group.id}
                      className="h-input w-full min-w-0 grow-0 px-1 text-center"
                      title={group.name}
                      aria-label={group.name}
                      disabled={!group.isActive}
                      to={ROUTES.pronunciationGroup.replace(':groupId', String(group.id))}
                    >
                      {contrastName ? (
                        <span className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
                          <span className="overflow-hidden text-right text-ellipsis whitespace-nowrap">
                            {contrastName[0]}
                          </span>
                          <span className="px-1">|</span>
                          <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap">
                            {contrastName[1]}
                          </span>
                        </span>
                      ) : (
                        group.name
                      )}
                    </NavigationButton>
                  );
                })}
              </div>
            </section>
          ))}
        </StackedList>
      </DataState>
    </OverviewCard>
  );
}

function splitContrastName(groupName: string): readonly [string, string] | null {
  const separatorIndex = groupName.indexOf('|');
  if (separatorIndex < 0) return null;
  return [
    groupName.slice(0, separatorIndex).trim(),
    groupName.slice(separatorIndex + 1).trim(),
  ];
}
