import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  type OverviewAvailability,
  useOverviewAvailability,
} from '@/features/overviews/use-overview-availability';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { NavigationButton } from '@/routing/data-navigation';

export default function Overviews(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const availability = useOverviewAvailability(userId);
  const grammarButton = getOverviewButtonState(
    availability.grammar,
    TEXTS.grammarOverviewTooltip,
    TEXTS.noGrammar,
  );
  const topicsButton = getOverviewButtonState(
    availability.topics,
    TEXTS.topicsOverviewTooltip,
    TEXTS.noTopics,
  );
  const vocabularyButton = getOverviewButtonState(
    availability.vocabulary,
    TEXTS.vocabularyOverviewTooltip,
    TEXTS.noStartedVocabulary,
  );
  return (
    <div className="card-width grow-0 gap-1">
      <h1 className="sr-only">{TEXTS.overviews}</h1>
      <section aria-label={TEXTS.progressOverviews}>
        <div className="flex flex-col gap-1">
          <NavigationButton
            className="h-button w-full"
            to={ROUTES.sounds}
            title={TEXTS.soundsOverview}
          >
            <MenuButtonText>{TEXTS.soundsOverview}</MenuButtonText>
          </NavigationButton>
          <NavigationButton
            className="h-button w-full"
            to={ROUTES.vocabulary}
            {...vocabularyButton}
          >
            <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
          </NavigationButton>
          <NavigationButton className="h-button w-full" to={ROUTES.topics} {...topicsButton}>
            <MenuButtonText>{TEXTS.topicsOverview}</MenuButtonText>
          </NavigationButton>
          <NavigationButton className="h-button w-full" to={ROUTES.grammar} {...grammarButton}>
            <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
          </NavigationButton>
        </div>
      </section>
    </div>
  );
}

function getOverviewButtonState(
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
