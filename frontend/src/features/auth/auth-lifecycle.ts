import { useAuthStore } from './use-auth-store';
import { resetPreparedRouteData } from '@/routing/route-data-handoff';

let cleanup: (() => void) | null = null;
let cacheCleanup: (() => void) | null = null;
let readyCleanup: (() => void) | null = null;
let readyPromise: Promise<void> | null = null;

/** Starts the singleton auth listener before route loaders begin resolving. */
export function startAuthLifecycle(): Promise<void> {
  if (readyPromise !== null) return readyPromise;

  cleanup = useAuthStore.getState().initializeAuth();
  let previousUserId = useAuthStore.getState().userId;
  cacheCleanup = useAuthStore.subscribe((state) => {
    if (state.userId === previousUserId) return;
    previousUserId = state.userId;
  resetPreparedRouteData();
  });
  readyPromise = new Promise<void>((resolve) => {
    if (!useAuthStore.getState().loading) {
      resolve();
      return;
    }

    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.loading) return;
      unsubscribe();
      readyCleanup = null;
      resolve();
    });
    readyCleanup = unsubscribe;
  });

  return readyPromise;
}

/** Waits for the first auth session resolution. */
export function waitForAuthReady(): Promise<void> {
  return startAuthLifecycle();
}

/** Test/HMR cleanup for the singleton auth listener. */
export function stopAuthLifecycle(): void {
  cleanup?.();
  cacheCleanup?.();
  readyCleanup?.();
  cleanup = null;
  cacheCleanup = null;
  readyCleanup = null;
  readyPromise = null;
}
