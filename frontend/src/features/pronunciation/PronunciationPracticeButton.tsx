import StyledButton from '@/components/UI/buttons/StyledButton';
import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { TEXTS } from '@/locales/cs';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';

export default function PronunciationPracticeButton({
  userId,
}: Readonly<{ userId: string }>) {
  const navigate = useNavigate();
  const selectedCount = useLiveQuery(
    () => UserItem.getPronunciationPracticeCount(userId),
    [userId],
    0,
  );

  return (
    <StyledButton
      className="h-button max-h-button w-full px-4"
      disabled={selectedCount === 0}
      onClick={() => navigate(ROUTES.pronunciationPractice)}
    >
      {TEXTS.pronunciationPracticeButton}
    </StyledButton>
  );
}
