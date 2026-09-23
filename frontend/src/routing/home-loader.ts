import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { ensurePracticeAvailability, resetPracticeAvailability } from '@/features/practice/practice-availability-controller';

export async function loadHome(): Promise<null> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (!userId) {
    resetPracticeAvailability();
    return null;
  }
  await ensurePracticeAvailability(userId);
  return null;
}
