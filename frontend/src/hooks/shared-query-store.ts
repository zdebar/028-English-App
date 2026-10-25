import { liveQuery } from 'dexie';
import { createStore, type StoreApi } from 'zustand/vanilla';
import config from '@/config/config';

export type QueryState<T> = { data: T | undefined; loading: boolean; error: Error | null };
type Entry<T> = { store: StoreApi<QueryState<T>>; query: () => Promise<T>; subscription?: { unsubscribe: () => void }; consumers: Map<string, number>; pins: Set<string>; disposed: boolean };
const queries = new Map<string, Entry<unknown>>();

function featureForKey(key: string): string {
  try { return JSON.parse(key)[1] as string; } catch { return 'unknown'; }
}

function shouldRelease(feature: string): boolean {
  return config.liveState?.releaseByFeature?.[feature] ?? config.liveState?.defaultRelease ?? true;
}

function start<T>(entry: Entry<T>): void {
  if (entry.subscription || entry.disposed) return;
  entry.store.setState({ loading: true, error: null });
  entry.subscription = liveQuery(entry.query).subscribe({
    next: (data) => { if (!entry.disposed) entry.store.setState({ data, loading: false, error: null }); },
    error: (error: unknown) => {
      entry.subscription = undefined;
      if (!entry.disposed) entry.store.setState({ loading: false, error: error instanceof Error ? error : new Error(String(error)) });
    },
  });
}

function stop<T>(entry: Entry<T>): void {
  entry.subscription?.unsubscribe();
  entry.subscription = undefined;
  entry.store.setState({ loading: false, error: null });
}

function createEntry<T>(query: () => Promise<T>): Entry<T> {
  return { store: createStore<QueryState<T>>(() => ({ data: undefined, loading: false, error: null })), query, consumers: new Map(), pins: new Set(), disposed: false };
}

export function sharedQueryKey(userId: string | null, name: string): string | undefined {
  if (!userId) return undefined;
  return JSON.stringify([userId, name]);
}

function getEntry<T>(key: string, query: () => Promise<T>): Entry<T> {
  let entry = queries.get(key) as Entry<T> | undefined;
  if (!entry) { entry = createEntry(query); queries.set(key, entry as Entry<unknown>); }
  return entry;
}

/** Registers a consumer. A shared Dexie observer runs once while any consumer needs it. */
export function observeSharedQuery<T>(key: string, feature: string, query: () => Promise<T>, listener: (state: QueryState<T>) => void): () => void {
  const entry = getEntry(key, query);
  const featureName = feature || featureForKey(key);
  if (!shouldRelease(featureName)) entry.pins.add(featureName);
  if (entry.store.getState().error) stop(entry);
  entry.consumers.set(featureName, (entry.consumers.get(featureName) ?? 0) + 1);
  start(entry);
  const unsubscribeStore = entry.store.subscribe(listener);
  listener(entry.store.getState());
  return () => {
    unsubscribeStore();
    const count = entry.consumers.get(featureName) ?? 0;
    if (count <= 1) entry.consumers.delete(featureName); else entry.consumers.set(featureName, count - 1);
    if (shouldRelease(featureName) && entry.consumers.size === 0 && entry.pins.size === 0) stop(entry);
  };
}

/** Compatibility access for callers that need the state API; observation starts on subscribe via observeSharedQuery. */
export function getSharedQuery<T>(key: string, query: () => Promise<T>) {
  return getEntry(key, query);
}

export function clearSharedQueriesExcept(userId: string | null): void {
  for (const [key, rawEntry] of queries) {
    const entry = rawEntry as Entry<unknown>;
    const [owner] = JSON.parse(key) as [string, string];
    if (owner === userId) continue;
    entry.disposed = true;
    stop(entry);
    entry.store.setState({ data: undefined, loading: false, error: new Error('Query account changed') });
    queries.delete(key);
  }
}

/** One-shot read for route loaders and prefetching; it never creates a live observer. */
export async function loadSharedQuery<T>(_userId: string, _name: string, query: () => Promise<T>): Promise<T> {
  return query();
}
