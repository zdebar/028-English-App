import { beforeEach, expect, it, vi } from 'vitest';
import { SupabaseError } from '@/types/error.types';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock('@/config/supabase.config', () => ({ supabaseInstance: { auth: mocks } }));
import { settleSyncWithAuthRecovery } from '../utils/sync-auth-recovery.utils';

const jwtError = new SupabaseError('Table sync failed', Object.assign(
  new Error('JWT issued at future'), { code: 'PGRST303' },
));

beforeEach(() => {
  vi.resetAllMocks();
  const session = { user: { id: 'u1' } };
  mocks.getSession.mockResolvedValue({ data: { session }, error: null });
  mocks.refreshSession.mockResolvedValue({ data: { session }, error: null });
});

it('refreshes once and retries only JWT-rejected tasks after the refresh', async () => {
  let refreshed = false;
  mocks.refreshSession.mockImplementation(async () => {
    refreshed = true;
    return { data: { session: { user: { id: 'u1' } } }, error: null };
  });
  const failed = vi.fn().mockRejectedValueOnce(jwtError).mockImplementation(async () => {
    expect(refreshed).toBe(true);
    return 2;
  });
  const successful = vi.fn().mockResolvedValue(1);
  const otherFailure = vi.fn().mockRejectedValue(new Error('Network unavailable'));
  const results = await settleSyncWithAuthRecovery('u1', [failed, successful, otherFailure]);
  expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled', 'rejected']);
  expect(failed).toHaveBeenCalledTimes(2);
  expect(successful).toHaveBeenCalledTimes(1);
  expect(otherFailure).toHaveBeenCalledTimes(1);
  expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
});

it('stops after one retry when the token is still rejected', async () => {
  const task = vi.fn().mockRejectedValue(jwtError);
  expect(await settleSyncWithAuthRecovery('u1', [task])).toEqual([
    { status: 'rejected', reason: jwtError },
  ]);
  expect(task).toHaveBeenCalledTimes(2);
  expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
});

it('does not refresh for unrelated failures', async () => {
  await settleSyncWithAuthRecovery('u1', [vi.fn().mockRejectedValue(new Error('Network'))]);
  expect(mocks.refreshSession).not.toHaveBeenCalled();
});

it('propagates refresh failure without retrying writes', async () => {
  const error = new Error('Refresh failed');
  mocks.refreshSession.mockResolvedValue({ data: { session: null }, error });
  const task = vi.fn().mockRejectedValue(jwtError);
  await expect(settleSyncWithAuthRecovery('u1', [task])).rejects.toBe(error);
  expect(task).toHaveBeenCalledTimes(1);
});

it('does not retry under another user identity', async () => {
  mocks.refreshSession.mockResolvedValue({ data: { session: { user: { id: 'u2' } } }, error: null });
  const task = vi.fn().mockRejectedValue(jwtError);
  await settleSyncWithAuthRecovery('u1', [task]);
  expect(task).toHaveBeenCalledTimes(1);
});
