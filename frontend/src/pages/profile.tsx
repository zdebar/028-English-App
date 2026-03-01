import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import ResetAllProgressButton from '@/features/auth/ResetAllProgressButton';
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
      <MenuButton text={TEXTS.levelsOverview} onClick={() => navigate(ROUTES.levels)} />
      <MenuButton text={TEXTS.grammarOverview} onClick={() => navigate(ROUTES.grammar)} />
      <MenuButton text={TEXTS.vocabularyOverview} onClick={() => navigate(ROUTES.vocabulary)} />

      <ResetAllProgressButton className="mt-4" />
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
