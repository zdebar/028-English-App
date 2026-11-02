import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { ensureDataManagerReady } from '@/database/state/data-store';

export async function loadHomePracticeAvailability(): Promise<null> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (userId) await ensureDataManagerReady(userId);
  return null;
}
