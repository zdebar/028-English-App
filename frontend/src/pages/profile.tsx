import ButtonRectangular from '@/components/UI/buttons/ButtonRectangular';
import { ROUTES } from '@/config/routes.config';
import { TEXTS } from '@/config/texts.config';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import ResetAllProgressButton from '@/features/auth/ResetAllProgressButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0">
      <ButtonRectangular onClick={() => navigate(ROUTES.grammar)}>
        <p>{TEXTS.grammarOverview}</p>
      </ButtonRectangular>
      <ButtonRectangular onClick={() => navigate(ROUTES.vocabulary)}>
        <p>{TEXTS.vocabularyOverview}</p>
      </ButtonRectangular>

      <ResetAllProgressButton className="mt-4" />
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
