import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react/jsx-dev-runtime';
import SyncButton from '@/features/sync/SyncButton';
import DownloadButton from '@/features/sync/DownloadButtton';

/**
 * Profile component that renders the user profile page.
 *
 * @returns The JSX element representing the Profile page.
 */
export default function Profile(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0 gap-1">
      <MenuButton onClick={() => navigate(ROUTES.levels)} title={TEXTS.levelsOverviewTooltip} className='px-20'>
        {TEXTS.levelsOverview}
      </MenuButton>
      <MenuButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip} className='px-20'>
        {TEXTS.grammarOverview}
      </MenuButton>
      <MenuButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-8 px-20"
      >
        {TEXTS.vocabularyOverview}
      </MenuButton >
      <DownloadButton className="px-20" />
      <SyncButton className="px-20" />
      <DeleteUserButton className="px-20" />
      <SignoutButton className="px-20" />
    </div>
  );
}
