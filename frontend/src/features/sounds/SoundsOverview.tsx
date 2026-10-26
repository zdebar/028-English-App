import OverviewCard from '@/components/UI/OverviewCard';
import StackedList from '@/components/UI/StackedList';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { getOverviewQuery, overviewQueryKey } from '@/hooks/overview-query-store';
import { useLiveQueryData } from '@/hooks/use-live-query-data';
import { TEXTS } from '@/locales/cs';
import type { SoundOverviewGroup } from '@/database/models/sound-groups';
import { useCallback } from 'react';
import { NavigationButton } from '@/routing/data-navigation';
import { useRouteClose } from '@/routing/use-route-close';

type SoundCategory = Readonly<{ title: string; phonemes: readonly string[] }>;

const SOUND_CATEGORIES: readonly SoundCategory[] = [
  { title: TEXTS.shortVowels, phonemes: ['ɪ', 'ɛ', 'æ', 'ʊ', 'ʌ', 'ə', 'ɚ'] },
  { title: TEXTS.longVowels, phonemes: ['i', 'u', 'ɑ', 'ɔ', 'ɝ'] },
  { title: TEXTS.doubleVowelSounds, phonemes: ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'oʊ'] },
  { title: TEXTS.voicelessConsonants, phonemes: ['p', 't', 'k', 'f', 'θ', 's', 'ʃ', 'tʃ', 'h'] },
  { title: TEXTS.voicedConsonants, phonemes: ['b', 'd', 'ɡ', 'v', 'ð', 'z', 'ʒ', 'dʒ'] },
  { title: TEXTS.otherConsonants, phonemes: ['m', 'n', 'ŋ', 'w', 'j', 'ɹ', 'l'] },
];

const SOUND_CATEGORY_HEADING_CLASS_NAME =
  'h-input border-disabled-light text-light dark:border-disabled-dark dark:text-dark flex w-full items-center justify-start border border-dashed px-4 text-left';

function SoundCategoryRow({
  category,
  soundsByName,
}: Readonly<{
  category: SoundCategory;
  soundsByName: ReadonlyMap<string, SoundOverviewGroup>;
}>) {
  return (
    <section className="flex flex-col gap-1">
      <div className={SOUND_CATEGORY_HEADING_CLASS_NAME}>{category.title}</div>
      <div className="grid grid-cols-9 gap-1">
        {category.phonemes.map((phoneme) => {
          const sound = soundsByName.get(phoneme);
          const destination = sound
            ? ROUTES.soundDetail.replace(':groupId', String(sound.id))
            : ROUTES.sounds;
          return (
            <NavigationButton
              key={phoneme}
              className="h-input w-full min-w-0 grow-0 px-1 text-center"
              to={destination}
              title={phoneme}
              aria-label={phoneme}
              disabled={!sound?.isActive}
            >
              {phoneme}
            </NavigationButton>
          );
        })}
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
  const soundsByName = new Map(sounds.map((sound) => [sound.name, sound]));

  return (
    <OverviewCard
      buttonTitle={TEXTS.soundsOverview}
      onClose={closeRoute}
      showResetAction={false}
    >
      <StackedList>
        {SOUND_CATEGORIES.map((category) => (
          <SoundCategoryRow
            key={category.title}
            category={category}
            soundsByName={soundsByName}
          />
        ))}
      </StackedList>
    </OverviewCard>
  );
}
