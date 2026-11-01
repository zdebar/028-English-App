import { supabaseInstance } from '@/config/supabase.config';

type SyncTask = () => Promise<unknown>;

function isFutureJwtError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const value = error as { code?: unknown; message?: unknown; cause?: unknown };
  if (value.code === 'PGRST303' && value.message === 'JWT issued at future') return true;
  return value.cause !== error && value.cause !== undefined && isFutureJwtError(value.cause);
}

/** Retries only timestamp-rejected tasks, once, after refreshing the same user's session. */
export async function settleSyncWithAuthRecovery(
  userId: string,
  tasks: SyncTask[],
): Promise<PromiseSettledResult<unknown>[]> {
  const results = await Promise.allSettled(tasks.map((task) => task()));
  const retryIndexes = results.flatMap((result, index) =>
    result.status === 'rejected' && isFutureJwtError(result.reason) ? [index] : [],
  );
  if (retryIndexes.length === 0) return results;

  const { data: current } = await supabaseInstance.auth.getSession();
  if (current.session?.user.id !== userId) return results;
  const { data, error } = await supabaseInstance.auth.refreshSession();
  if (error) throw error;
  if (data.session?.user.id !== userId) return results;

  const retried = await Promise.allSettled(retryIndexes.map((index) => tasks[index]()));
  retryIndexes.forEach((index, retryIndex) => {
    results[index] = retried[retryIndex];
  });
  return results;
}
