import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  type OverviewAvailability,
  useOverviewAvailability,
} from '@/hooks/use-overview-availability';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { OverviewAvailabilityData } from '@/routing/route-data';
import {
  grammarDescriptor,
  topicsDescriptor,
  vocabularyDescriptor,
} from '@/routing/route-data';
import { DataNavigationButton } from '@/routing/data-navigation';
import { usePronunciationGroupsStore } from '@/features/pronunciation/use-pronunciation-groups-store';

function getButtonState(
  availability: OverviewAvailability,
  availableTitle: string,
  emptyTitle: string,
) {
  if (availability.loading) return { disabled: true, title: TEXTS.loadingMessage };
  if (availability.error) return { disabled: true, title: TEXTS.loadingError };
  return {
    disabled: !availability.hasData,
    title: availability.hasData ? availableTitle : emptyTitle,
  };
}

export default function Overviews(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const initialAvailability = useLoaderData() as OverviewAvailabilityData;
  const availability = useOverviewAvailability(userId, initialAvailability);
  const pronunciationGroups = usePronunciationGroupsStore((state) => state.groups);
  const pronunciationLoading = usePronunciationGroupsStore((state) => state.loading);
  const pronunciationError = usePronunciationGroupsStore((state) => state.error);
  const grammarButton = getButtonState(
    availability.grammar,
    TEXTS.grammarOverviewTooltip,
    TEXTS.noGrammar,
  );
  const topicsButton = getButtonState(
    availability.topics,
    TEXTS.topicsOverviewTooltip,
    TEXTS.noTopics,
  );
  const vocabularyButton = getButtonState(
    availability.vocabulary,
    TEXTS.vocabularyOverviewTooltip,
    TEXTS.noStartedVocabulary,
  );
  const pronunciationButton = getButtonState(
    {
      hasData: pronunciationGroups.length > 0,
      loading: pronunciationLoading,
      error: pronunciationError,
    },
    TEXTS.pronunciationGroupsTooltip,
    TEXTS.noPronunciationGroups,
  );
  return (
    <div className="card-width grow-0 gap-1">
      <h1 className="sr-only">{TEXTS.overviews}</h1>
      <section aria-label={TEXTS.progressOverviews}>
        <div className="flex flex-col gap-1">
          <DataNavigationButton
            className="h-button w-full"
            to={ROUTES.grammar}
            descriptor={userId ? grammarDescriptor(userId) : undefined}
            {...grammarButton}
          >
            <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
          </DataNavigationButton>
          <DataNavigationButton
            className="h-button w-full"
            to={ROUTES.topics}
            descriptor={userId ? topicsDescriptor(userId) : undefined}
            {...topicsButton}
          >
            <MenuButtonText>{TEXTS.topicsOverview}</MenuButtonText>
          </DataNavigationButton>
          <DataNavigationButton
            className="h-button w-full"
            to={ROUTES.vocabulary}
            descriptor={userId ? vocabularyDescriptor(userId) : undefined}
            {...vocabularyButton}
          >
            <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
          </DataNavigationButton>
          <DataNavigationButton
            className="h-button w-full"
            to={ROUTES.pronunciationGroups}
            {...pronunciationButton}
          >
            <MenuButtonText>{TEXTS.pronunciationSettings}</MenuButtonText>
          </DataNavigationButton>
        </div>
      </section>
    </div>
  );
}
