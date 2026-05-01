import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react/jsx-dev-runtime';

/**
 * Profile page component.
 * @returns The rendered Profile page component.
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
      <MenuButton onClick={() => navigate(ROUTES.blocks)} title={TEXTS.blocksOverviewTooltip}>
        {TEXTS.blocksOverview}
      </MenuButton>
      <MenuButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-10"
      >
        {TEXTS.vocabularyOverview}
      </MenuButton>
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
