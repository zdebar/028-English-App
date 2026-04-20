import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react/jsx-dev-runtime';

/**
 * Profile component that renders the user profile page.
 *
 * @returns The JSX element representing the Profile page.
 */
export default function Profile(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0 gap-1">
      <MenuButton onClick={() => navigate(ROUTES.levels)} title={TEXTS.levelsOverviewTooltip}>
        <p className="mx-auto w-40">{TEXTS.levelsOverview}</p>
      </MenuButton>
      <MenuButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip}>
        <p className="mx-auto w-40">{TEXTS.grammarOverview}</p>
      </MenuButton>
      <MenuButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-10"
      >
        <p className="mx-auto w-40">{TEXTS.vocabularyOverview}</p>
      </MenuButton>
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
