import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { StandardButton } from '@/components/UI/buttons/StandardButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import {
  type OverviewAvailability,
  useOverviewAvailability,
} from '@/hooks/use-overview-availability';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const availability = useOverviewAvailability(userId);
  const practiceButton = getButtonState(
    availability.practice,
    TEXTS.practiceOverviewTitle,
    TEXTS.practiceOverviewNone,
  );
  const levelsButton = getButtonState(
    availability.levels,
    TEXTS.levelsOverviewTooltip,
    TEXTS.noDashboardData,
  );
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
    availability.pronunciation,
    TEXTS.pronunciationGroupsTooltip,
    TEXTS.noPronunciationGroups,
  );

  return (
    <div className="card-width grow-0 gap-1">
      <h1 className="sr-only">{TEXTS.overviews}</h1>
      <section aria-label={TEXTS.progressOverviews}>
        <div className="flex flex-col gap-1">
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.practiceOverview)}
            {...practiceButton}
          >
            <MenuButtonText>{TEXTS.practiceOverviewTitle}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.levels)}
            {...levelsButton}
          >
            <MenuButtonText>{TEXTS.levelsOverview}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.grammar)}
            {...grammarButton}
          >
            <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.topics)}
            {...topicsButton}
          >
            <MenuButtonText>{TEXTS.topicsOverview}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.vocabulary)}
            {...vocabularyButton}
          >
            <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
          </StandardButton>
        </div>
      </section>
      <section aria-label={TEXTS.pronunciationSettings} className="mt-6">
        <StandardButton
          className="w-full"
          onClick={() => navigate(ROUTES.pronunciationGroups)}
          {...pronunciationButton}
        >
          <MenuButtonText>{TEXTS.pronunciationGroups}</MenuButtonText>
        </StandardButton>
      </section>
    </div>
  );
}
