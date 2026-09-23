import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  reconcile: vi.fn().mockResolvedValue(null),
  reportError: vi.fn(),
  showToast: vi.fn(),
}));
vi.mock('../practice-availability', () => ({
  loadPracticeAvailabilitySnapshot: (...args: unknown[]) => mocks.load(...args),
}));
vi.mock('@/database/models/practice-sessions', () => ({
  default: { reconcileActive: (...args: unknown[]) => mocks.reconcile(...args) },
}));
vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));
vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: { getState: () => ({ showToast: mocks.showToast }) },
}));

import { usePracticeAvailabilityStoreSync } from '../use-practice-availability-store-sync';
import { usePracticeAvailabilityStore } from '../use-practice-availability-store';
import { usePracticeAvailabilityBoundary } from '../hooks/use-practice-availability-boundary';
import {
  ensurePracticeAvailability,
  refreshPracticeAvailability,
  resetPracticeAvailability,
} from '../practice-availability-controller';

const snapshot: import('../practice-availability').PracticeAvailabilitySnapshot = {
  reviewReadyAt: '2026-07-21T10:00:00.000Z',
  initialTrainingAvailable: true,
  activeSession: null,
  requiresSessionReconciliation: false,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('availability refresh lifecycle', () => {
  beforeEach(() => {
    resetPracticeAvailability();
    vi.clearAllMocks();
    mocks.load.mockResolvedValue(snapshot);
  });

  it('loads once and reuses the date across mounts and navigation', async () => {
    const first = renderHook(() => usePracticeAvailabilityStoreSync('u1'));
    await waitFor(() => expect(usePracticeAvailabilityStore.getState().practiceLoading).toBe(false));
    first.unmount();
    renderHook(() => usePracticeAvailabilityStoreSync('u1'));
    await ensurePracticeAvailability('u1');
    expect(mocks.load).toHaveBeenCalledOnce();
    expect(usePracticeAvailabilityStore.getState().reviewReadyAt).toBe(snapshot.reviewReadyAt);
  });

  it('refreshes after explicit synchronization and reset notifications', async () => {
    await ensurePracticeAvailability('u1');
    await refreshPracticeAvailability('u1');
    await refreshPracticeAvailability('u1');
    expect(mocks.load).toHaveBeenCalledTimes(3);
  });

  it('does not refresh after answers; defers sync until exit and pending saves finish', async () => {
    await ensurePracticeAvailability('u1');
    const { result, unmount } = renderHook(() => usePracticeAvailabilityBoundary('u1'));
    await result.current(Promise.resolve());
    await refreshPracticeAvailability('u1');
    await refreshPracticeAvailability('u1');
    expect(mocks.load).toHaveBeenCalledOnce();

    const save = deferred<void>();
    result.current(save.promise);
    unmount();
    await Promise.resolve();
    expect(mocks.load).toHaveBeenCalledOnce();
    save.resolve();
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
  });

  it('refreshes on practice exit even when a pending save fails', async () => {
    await ensurePracticeAvailability('u1');
    const { result, unmount } = renderHook(() => usePracticeAvailabilityBoundary('u1'));
    const failure = result.current(Promise.reject(new Error('write failed')));
    unmount();
    await expect(failure).rejects.toThrow('write failed');
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
  });

  it('ignores old account results and late refresh requests after sign-out', async () => {
    const oldLoad = deferred<typeof snapshot>();
    mocks.load.mockReturnValueOnce(oldLoad.promise);
    const oldRequest = ensurePracticeAvailability('u1');
    await ensurePracticeAvailability('u2');
    oldLoad.resolve({ ...snapshot, reviewReadyAt: null });
    await oldRequest;
    expect(usePracticeAvailabilityStore.getState().availabilityUserId).toBe('u2');
    expect(usePracticeAvailabilityStore.getState().reviewReadyAt).toBe(snapshot.reviewReadyAt);
    resetPracticeAvailability();
    await refreshPracticeAvailability('u1');
    expect(usePracticeAvailabilityStore.getState().availabilityUserId).toBeNull();
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });

  it('coalesces concurrent changes and retains the newest snapshot', async () => {
    await ensurePracticeAvailability('u1');
    const syncLoad = deferred<typeof snapshot>();
    mocks.load.mockReturnValueOnce(syncLoad.promise);
    const sync = refreshPracticeAvailability('u1');
    const reset = refreshPracticeAvailability('u1');
    syncLoad.resolve({ ...snapshot, reviewReadyAt: null });
    await Promise.all([sync, reset]);
    expect(mocks.load).toHaveBeenCalledTimes(3);
    expect(usePracticeAvailabilityStore.getState().reviewReadyAt).toBe(snapshot.reviewReadyAt);
  });

  it('reconciles invalid sessions and then reads a consistent snapshot', async () => {
    mocks.load.mockResolvedValueOnce({ ...snapshot, requiresSessionReconciliation: true });
    await ensurePracticeAvailability('u1');
    expect(mocks.reconcile).toHaveBeenCalledWith('u1');
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });

  it('clears account data on sign-out and reports loading failures', async () => {
    mocks.load.mockRejectedValueOnce(new Error('failed'));
    const { rerender } = renderHook(({ userId }) => usePracticeAvailabilityStoreSync(userId), {
      initialProps: { userId: 'u1' as string | null },
    });
    await waitFor(() => expect(usePracticeAvailabilityStore.getState().practiceError?.message).toBe('failed'));
    expect(mocks.reportError).toHaveBeenCalledOnce();
    expect(mocks.showToast).toHaveBeenCalledOnce();
    act(() => rerender({ userId: null }));
    expect(usePracticeAvailabilityStore.getState().availabilityUserId).toBeNull();
  });
});
