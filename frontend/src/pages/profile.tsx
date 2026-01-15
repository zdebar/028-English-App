import SignoutButton from '@/features/auth/SignoutButton';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/UI/buttons/Button';
import ResetAllProgressButton from '@/features/auth/ResetAllProgressButton';
import DeleteUserButton from '@/features/auth/DeleteUserButton';

export default function Profile() {
  const navigate = useNavigate();

  return (
    <>
      <div className="card-width grow-0">
        <Button onClick={() => navigate('/grammar')} className="grow-0">
          <p>Přehled gramatiky</p>
        </Button>
        <Button onClick={() => navigate('/vocabulary')} className="grow-0">
          <p>Přehled slovíček</p>
        </Button>
        <br />
        <ResetAllProgressButton />
        <DeleteUserButton />
        <SignoutButton />
      </div>
    </>
  );
}
