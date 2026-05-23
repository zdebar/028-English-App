import { MenuButtonText } from '@/components/UI/MenuButtonText';
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
  const userFullName = useAuthStore((state) => state.userFullName);
  const userEmail = useAuthStore((state) => state.userEmail);
  const userDisplayName = userFullName || userEmail;

  return (
    <div className="card-width grow-0 gap-1">
      <p className="my-4 mx-auto w-40 text-left">
        {userDisplayName}
      </p>
      <StandardButton onClick={() => navigate(ROUTES.levels)} title={TEXTS.levelsOverviewTooltip}>
        <MenuButtonText>{TEXTS.levelsOverview}</MenuButtonText>
      </StandardButton>
      <StandardButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip}>
        <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
      </StandardButton>
      <StandardButton onClick={() => navigate(ROUTES.blocks)} title={TEXTS.blocksOverviewTooltip}>
        <MenuButtonText>{TEXTS.blocksOverview}</MenuButtonText>
      </StandardButton>
      <StandardButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-10"
      >
        <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
      </StandardButton>
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
