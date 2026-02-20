import { useAuthStore } from '../auth/use-auth-store';
import { useUserStore } from './use-user-store';

export function useCurrentUserStats() {
  const userId = useAuthStore((state) => state.userId);
  return useUserStore((state) => state.userStats[userId || 'anonymous']);
}
