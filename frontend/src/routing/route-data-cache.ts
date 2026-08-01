export type RouteDataDescriptor<T> = Readonly<{
  key: string;
  load: () => Promise<T>;
}>;

type CacheEntry = {
  promise: Promise<unknown>;
  timeoutId: ReturnType<typeof setTimeout>;
};

export const ROUTE_PREFETCH_TTL_MS = 10_000;

const entries = new Map<string, CacheEntry>();

export function routeDataKey(
  route: string,
  userId: string,
  parameter?: string | number,
): string {
  const baseKey = `${route}:${userId}`;
  return parameter == null ? baseKey : `${baseKey}:${parameter}`;
}

function createEntry<T>(descriptor: RouteDataDescriptor<T>): Promise<T> {
  let promise: Promise<T>;
  promise = Promise.resolve().then(descriptor.load).catch((error) => {
    if (entries.get(descriptor.key)?.promise === promise) {
      const entry = entries.get(descriptor.key);
      if (entry) globalThis.clearTimeout(entry.timeoutId);
      entries.delete(descriptor.key);
    }
    throw error;
  });

  const timeoutId = globalThis.setTimeout(() => {
    if (entries.get(descriptor.key)?.promise === promise) {
      entries.delete(descriptor.key);
    }
  }, ROUTE_PREFETCH_TTL_MS);
  entries.set(descriptor.key, { promise, timeoutId });
  return promise;
}

/** Starts or reuses one short-lived route-data request. */
export function prefetchRouteData<T>(descriptor: RouteDataDescriptor<T>): Promise<T> {
  const current = entries.get(descriptor.key);
  return (current?.promise as Promise<T> | undefined) ?? createEntry(descriptor);
}

/** Hands prefetched data to a route loader once, falling back to a direct load. */
export function consumeRouteData<T>(descriptor: RouteDataDescriptor<T>): Promise<T> {
  const current = entries.get(descriptor.key);
  if (!current) return descriptor.load();

  globalThis.clearTimeout(current.timeoutId);
  entries.delete(descriptor.key);
  return current.promise as Promise<T>;
}

/** Invalidates one key or every key beginning with a route/user prefix. */
export function invalidateRouteData(keyOrPrefix: string): void {
  for (const [key, entry] of entries) {
    if (key !== keyOrPrefix && !key.startsWith(keyOrPrefix)) continue;
    globalThis.clearTimeout(entry.timeoutId);
    entries.delete(key);
  }
}

/** Clears every pending route-data handoff. Primarily used by auth changes and tests. */
export function resetRouteDataCache(): void {
  entries.forEach((entry) => globalThis.clearTimeout(entry.timeoutId));
  entries.clear();
}
