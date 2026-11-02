import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { ensureDataPackage } from '@/database/state/data-store';

export async function loadHomeDataPackage(): Promise<null> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (userId) await ensureDataPackage(userId, { kind: 'home' });
  return null;
}
