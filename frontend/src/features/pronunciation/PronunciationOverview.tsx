import { DataState } from '@/components/UI/DataState';
import StackedList from '@/components/UI/StackedList';
import OverviewCard from '@/components/UI/OverviewCard';
import { ROUTES } from '@/config/routes.config';
import HelpButton from '@/features/help/HelpButton';
import HelpText from '@/features/help/HelpText';
import { TEXTS } from '@/locales/cs';
import { NavigationButton } from '@/routing/data-navigation';
import { usePronunciationGroupsStore } from './use-pronunciation-groups-store';
import { useRouteClose } from '@/routing/use-route-close';
import { useQueryErrorToast } from '@/features/logging/use-query-error-toast';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { usePronunciationGroupsStoreSync } from './use-pronunciation-groups-store-sync';

const VOWEL_PHONEMES = new Set([
  'i', 'iː', 'ɪ', 'e', 'ɛ', 'æ', 'a', 'ɑ', 'ɒ', 'ɔ', 'o', 'oʊ', 'ʊ', 'u', 'uː', 'ʌ', 'ə',
  'ɝ', 'ɚ', 'eɪ', 'aɪ', 'ɔɪ', 'aʊ',
]);

const CATEGORY_HEADING_CLASS_NAME =
  'h-input border-disabled-light text-light dark:border-disabled-dark dark:text-dark flex w-full items-center justify-start border border-dashed px-4 text-left';

function isVowelContrast(groupName: string): boolean {
  const phonemes = groupName
    .split(/[|×–—]/)
    .map((phoneme) => phoneme.trim().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  return phonemes.length > 0 && phonemes.every((phoneme) => VOWEL_PHONEMES.has(phoneme));
}

export default function PronunciationOverview() {
  usePronunciationGroupsStoreSync(useAuthStore((state) => state.userId));
  const closeRoute = useRouteClose(ROUTES.overviews);
  const data = usePronunciationGroupsStore((state) => state.groups);
  const loading = usePronunciationGroupsStore((state) => state.loading);
  const error = usePronunciationGroupsStore((state) => state.error);
  const hasData = data.length > 0;
  const consonantGroups = data.filter((group) => !isVowelContrast(group.name));
  const vowelGroups = data.filter((group) => isVowelContrast(group.name));

  useQueryErrorToast(error, 'Failed to fetch pronunciation overview');

  return (
    <OverviewCard
      buttonTitle={TEXTS.pronunciationSettings}
      onClose={closeRoute}
      className={hasData ? 'bottom-controls-clearance' : ''}
    >
      <DataState loading={loading} hasData={hasData} noDataMessage={TEXTS.noPronunciationGroups}>
        <StackedList>
          {[
            { title: TEXTS.pronunciationConsonants, groups: consonantGroups },
            { title: TEXTS.pronunciationVowels, groups: vowelGroups },
          ].map((category) => (
            <section key={category.title} className="flex flex-col gap-1">
              <div className={CATEGORY_HEADING_CLASS_NAME}>{category.title}</div>
              <div className="grid grid-cols-2 gap-1 min-[480px]:grid-cols-4">
                {category.groups.map((group) => (
                  <NavigationButton
                    key={group.id}
                    className="h-input w-full min-w-0 grow-0 px-1 text-center"
                    title={group.name}
                    aria-label={group.name}
                    disabled={!group.isActive}
                    to={ROUTES.pronunciationGroup.replace(':groupId', String(group.id))}
                  >
                    {group.name}
                  </NavigationButton>
                ))}
              </div>
            </section>
          ))}
        </StackedList>
        <HelpText className="top-20 right-2">{TEXTS.pronunciationStartedHelp}</HelpText>
        <div className="pos-bottom-right-control">
          <HelpButton />
        </div>
      </DataState>
    </OverviewCard>
  );
}
