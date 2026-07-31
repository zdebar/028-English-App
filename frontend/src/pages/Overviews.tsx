import { MenuButtonText } from '@/components/UI/MenuButtonText';
import { StandardButton } from '@/components/UI/buttons/StandardButton';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Overviews(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0 gap-1">
      <h1 className="sr-only">{TEXTS.overviews}</h1>
      <section aria-label={TEXTS.progressOverviews} className="mt-6">
        <div className="flex flex-col gap-1">
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.practiceOverview)}
            title={TEXTS.practiceOverviewTitle}
          >
            <MenuButtonText>{TEXTS.practiceOverviewTitle}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.levels)}
            title={TEXTS.levelsOverviewTooltip}
          >
            <MenuButtonText>{TEXTS.levelsOverview}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.grammar)}
            title={TEXTS.grammarOverviewTooltip}
          >
            <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.topics)}
            title={TEXTS.topicsOverviewTooltip}
          >
            <MenuButtonText>{TEXTS.topicsOverview}</MenuButtonText>
          </StandardButton>
          <StandardButton
            className="w-full"
            onClick={() => navigate(ROUTES.vocabulary)}
            title={TEXTS.vocabularyOverviewTooltip}
          >
            <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
          </StandardButton>
        </div>
      </section>
      <section aria-label={TEXTS.pronunciationSettings} className="mt-6">
        <StandardButton
          className="w-full"
          onClick={() => navigate(ROUTES.pronunciationGroups)}
          title={TEXTS.pronunciationGroupsTooltip}
        >
          <MenuButtonText>{TEXTS.pronunciationGroups}</MenuButtonText>
        </StandardButton>
      </section>
    </div>
  );
}
