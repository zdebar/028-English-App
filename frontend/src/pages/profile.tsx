import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react/jsx-dev-runtime';
// import SyncButton from '@/features/sync/SyncButton';
// import DownloadButton from '@/features/sync/DownloadButtton';

/**
 * Profile component that renders the user profile page.
 *
 * @returns The JSX element representing the Profile page.
 */
export default function Profile(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0 gap-1">
      <MenuButton onClick={() => navigate(ROUTES.levels)} title={TEXTS.levelsOverviewTooltip} >
        <p className="w-40 mx-auto">{TEXTS.levelsOverview}</p>
      </MenuButton>
      <MenuButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip}>
        <p className="w-40 mx-auto">{TEXTS.grammarOverview}</p>
      </MenuButton>
      <MenuButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
      >
        <p className="w-40 mx-auto">{TEXTS.vocabularyOverview}</p>
      </MenuButton >
      <hr  className='my-1 border-dashed'/>
      {/* <DownloadButton  />
      <SyncButton  /> */}
      <DeleteUserButton />
      <SignoutButton  />
    </div>
  );
}
