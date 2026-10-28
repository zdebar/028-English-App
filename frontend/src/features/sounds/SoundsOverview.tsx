import OverviewCard from '@/components/UI/OverviewCard';
import StackedList from '@/components/UI/StackedList';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { getOverviewQuery, overviewQueryKey } from '@/hooks/overview-query-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import type { SoundOverviewGroup } from '@/database/models/sound-groups';
import type { SoundCategory } from '@/types/table.types';
import { useCallback } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';

type SoundCategoryPresentation = Readonly<{ key: SoundCategory; title: string }>;

const SOUND_CATEGORY_PRESENTATION: readonly SoundCategoryPresentation[] = [
  { key: 'short_vowel', title: TEXTS.shortVowels },
  { key: 'long_vowel', title: TEXTS.longVowels },
  { key: 'diphthong', title: TEXTS.doubleVowelSounds },
  { key: 'voiceless_consonant', title: TEXTS.voicelessConsonants },
  { key: 'voiced_consonant', title: TEXTS.voicedConsonants },
  { key: 'other_consonant', title: TEXTS.otherConsonants },
];

const SOUND_CATEGORY_HEADING_CLASS_NAME =
  'h-input border-disabled-light text-light dark:border-disabled-dark dark:text-dark flex w-full items-center justify-start border border-dashed px-4 text-left';

function SoundCategoryRow({
  category,
  sounds,
}: Readonly<{
  category: SoundCategoryPresentation;
  sounds: readonly SoundOverviewGroup[];
}>) {
  return (
    <section className="flex flex-col gap-1">
      <div className={SOUND_CATEGORY_HEADING_CLASS_NAME}>{category.title}</div>
      <div className="grid grid-cols-9 gap-1">
        {sounds.map((sound) => (
          <NavigationButton
            key={sound.id}
            className="h-input w-full min-w-0 grow-0 px-1 text-center"
            to={ROUTES.soundDetail.replace(':groupId', String(sound.id))}
            title={sound.name}
            aria-label={sound.name}
            disabled={!sound.isActive}
          >
            {sound.name}
          </NavigationButton>
        ))}
      </div>
    </section>
  );
}

export default function SoundsOverview({
  initialSounds,
}: Readonly<{ initialSounds?: SoundOverviewGroup[] }>) {
  const userId = useAuthStore((state) => state.userId);
  const closeRoute = useRouteClose(ROUTES.overviews);
  const fetchSounds = useCallback((): Promise<SoundOverviewGroup[]> => {
    if (!userId) return Promise.resolve([]);
    return getOverviewQuery(userId, 'sounds')();
  }, [userId]);
  const { data: sounds, error } = useLiveQueryData<SoundOverviewGroup[]>(fetchSounds, {
    emptyData: [],
    initialData: initialSounds,
    sharedKey: userId ? overviewQueryKey(userId, 'sounds') : undefined,
  });

  useQueryErrorToast(error, 'Failed to fetch sound overview');

  return (
    <OverviewCard
      buttonTitle={TEXTS.soundsOverview}
      onClose={closeRoute}
      showResetAction={false}
    >
      <StackedList>
        {SOUND_CATEGORY_PRESENTATION.map((category) => (
          <SoundCategoryRow
            key={category.key}
            category={category}
            sounds={sounds.filter((sound) => sound.sound_category === category.key)}
          />
        ))}
      </StackedList>
    </OverviewCard>
  );
}
