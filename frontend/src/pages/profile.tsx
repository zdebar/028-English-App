import Button from '@/components/UI/buttons/Button';
import { TEXTS } from '@/config/texts';
import DeleteUserButton from '@/features/auth/DeleteUserButton';
import ResetAllProgressButton from '@/features/auth/ResetAllProgressButton';
import SignoutButton from '@/features/auth/SignoutButton';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="card-width grow-0">
      <Button onClick={() => navigate('/grammar')} className="grow-0">
        <p>{TEXTS.profileGrammarOverview}</p>
      </Button>
      <Button onClick={() => navigate('/vocabulary')} className="grow-0">
        <p>{TEXTS.profileVocabularyOverview}</p>
      </Button>

      <ResetAllProgressButton className="mt-4" />
      <DeleteUserButton />
      <SignoutButton />
    </div>
  );
}
