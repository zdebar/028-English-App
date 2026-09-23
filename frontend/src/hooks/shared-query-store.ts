import { liveQuery } from 'dexie';
import { createStore } from 'zustand/vanilla';

type QueryState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
};

function createQueryStore<T>(query: () => Promise<T>) {
  const store = createStore<QueryState<T>>(() => ({
    data: undefined,
    loading: true,
    error: null,
  }));
  let subscription: { unsubscribe: () => void } | undefined;
  let active = true;
  const restart = () => {
    subscription?.unsubscribe();
    store.setState({ loading: true, error: null });
    subscription = liveQuery(query).subscribe({
      next: (data) => {
        if (active) store.setState({ data, loading: false, error: null });
      },
      error: (error: unknown) => {
        if (!active) return;
        store.setState({
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      },
    });
  };
  restart();
  return {
    store,
    restart,
    dispose: () => {
      active = false;
      subscription?.unsubscribe();
      store.setState({ loading: false, error: new Error('Query account changed') });
    },
  };
}

const queries = new Map<string, ReturnType<typeof createQueryStore<unknown>>>();

/** User-scoped identity shared by a route loader and its page subscription. */
export function sharedQueryKey(userId: string | null, name: string): string | undefined {
  if (!userId) return undefined;
  return JSON.stringify([userId, name]);
}

/** Keeps one live subscription across page mounts, until the account changes. */
export function getSharedQuery<T>(key: string, query: () => Promise<T>) {
  let entry = queries.get(key);
  if (!entry) {
    entry = createQueryStore(query);
    queries.set(key, entry);
  } else if (entry.store.getState().error) {
    entry.restart();
  }
  return entry as ReturnType<typeof createQueryStore<T>>;
}

export function clearSharedQueriesExcept(userId: string | null): void {
  for (const [key, entry] of queries) {
    const [owner] = JSON.parse(key) as [string, string];
    if (owner === userId) continue;
    entry.dispose();
    queries.delete(key);
  }
}

/** Waits for the same snapshot the page observes; it does not run a second query. */
export async function loadSharedQuery<T>(userId: string, name: string, query: () => Promise<T>): Promise<T> {
  const key = sharedQueryKey(userId, name)!;
  const { store } = getSharedQuery(key, query);
  if (store.getState().loading) {
    await new Promise<void>((resolve) => {
      const unsubscribe = store.subscribe((state) => {
        if (state.loading) return;
        unsubscribe();
        resolve();
      });
    });
  }
  const state = store.getState();
  if (state.error) {
    throw state.error;
  }
  return state.data as T;
}
