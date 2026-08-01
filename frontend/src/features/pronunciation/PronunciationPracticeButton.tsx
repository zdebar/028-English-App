import { ROUTES } from '@/config/routes.config';
import UserItem from '@/database/models/user-items';
import { TEXTS } from '@/locales/cs';
import { useLiveQuery } from 'dexie-react-hooks';
import { PrefetchButton } from '@/routing/prefetch-navigation';
import { pronunciationPracticeDescriptor } from '@/routing/route-data';

export default function PronunciationPracticeButton({
  userId,
}: Readonly<{ userId: string }>) {
  const selectedCount = useLiveQuery(
    () => UserItem.getPronunciationPracticeCount(userId),
    [userId],
    0,
  );

  return (
    <PrefetchButton
      to={ROUTES.pronunciationPractice}
      descriptor={pronunciationPracticeDescriptor(userId)}
      className="h-button max-h-button w-full px-4"
      disabled={selectedCount === 0}
    >
      {TEXTS.pronunciationPracticeButton}
    </PrefetchButton>
  );
}
