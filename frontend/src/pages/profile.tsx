import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react/jsx-dev-runtime';
import SyncButton from '@/features/sync/SyncButton';

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
        {TEXTS.levelsOverview}
      </MenuButton>
      <MenuButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip}>
        {TEXTS.grammarOverview}
      </MenuButton>
      <MenuButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-8"
      >
        {TEXTS.vocabularyOverview}
      </MenuButton>
      <SyncButton />
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
