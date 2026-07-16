import { MenuButtonText } from '@/components/UI/MenuButtonText';
import PropertyView from '@/components/UI/PropertyView';
import { StandardButton } from '@/components/UI/buttons/StandardButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Profile page component.
 * @returns The rendered Profile page component.
 */
export default function Profile(): JSX.Element {
  const navigate = useNavigate();
  const userEmail = useAuthStore((state) => state.userEmail);

  return (
    <div className="card-width grow-0 gap-1">
      <div className="mx-auto mt-6 mb-4 w-64 text-left">
        <PropertyView
          label={TEXTS.profileEmailLabel}
          className="justify-center"
          classNameLabel="w-20"
          classNameValue="wrap-break-word"
        >
          {userEmail || TEXTS.notAvailable}
        </PropertyView>
      </div>
      <StandardButton onClick={() => navigate(ROUTES.levels)} title={TEXTS.levelsOverviewTooltip}>
        <MenuButtonText>{TEXTS.levelsOverview}</MenuButtonText>
      </StandardButton>
      <StandardButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip}>
        <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
      </StandardButton>
      <StandardButton onClick={() => navigate(ROUTES.topics)} title={TEXTS.topicsOverviewTooltip}>
        <MenuButtonText>{TEXTS.topicsOverview}</MenuButtonText>
      </StandardButton>
      <StandardButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-8"
      >
        <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
      </StandardButton>
      <SignoutButton />
      <DeleteUserButton />
    </div>
  );
}
