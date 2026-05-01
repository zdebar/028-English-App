import { MenuButton } from '@/components/UI/buttons/MenuButton';
import { ROUTES } from '@/config/routes.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { TEXTS } from '@/locales/cs';
import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react/jsx-dev-runtime';
import { MenuButtonText } from '@/components/UI/MenuButtonText';

/**
 * Profile page component.
 * @returns The rendered Profile page component.
 */
export default function Profile(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0 gap-1">
      <MenuButton onClick={() => navigate(ROUTES.levels)} title={TEXTS.levelsOverviewTooltip}>
        <MenuButtonText>{TEXTS.levelsOverview}</MenuButtonText>
      </MenuButton>
      <MenuButton onClick={() => navigate(ROUTES.grammar)} title={TEXTS.grammarOverviewTooltip}>
        <MenuButtonText>{TEXTS.grammarOverview}</MenuButtonText>
      </MenuButton>
      <MenuButton onClick={() => navigate(ROUTES.blocks)} title={TEXTS.blocksOverviewTooltip}>
        <MenuButtonText>{TEXTS.blocksOverview}</MenuButtonText>
      </MenuButton>
      <MenuButton
        onClick={() => navigate(ROUTES.vocabulary)}
        title={TEXTS.vocabularyOverviewTooltip}
        className="mb-10"
      >
        <MenuButtonText>{TEXTS.vocabularyOverview}</MenuButtonText>
      </MenuButton>
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
