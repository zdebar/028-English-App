import OverviewCard from '@/components/UI/OverviewCard';
import StackedList from '@/components/UI/StackedList';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { SoundCategory } from '@/types/table.types';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';
import { useDataManager } from '@/database/state/data-store';
import { selectSoundOverview } from '@/database/state/data-selectors';
import type { SoundOverviewGroup } from '@/database/state/data-types';

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

export default function SoundsOverview() {
  const userId = useAuthStore((state) => state.userId);
  const dataState = useDataManager((state) => state);
  const closeRoute = useRouteClose(ROUTES.overviews);
  const sounds = userId ? selectSoundOverview(dataState, userId) : [];

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
