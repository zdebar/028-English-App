import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import config from '@/config/config';
import { db } from '@/database/models/db';
import type {
  AppDataChanges,
  AppDataSnapshot,
  DataManagerState,
  DataPackageRequest,
  DataPackageValue,
} from './data-types';
import { EMPTY_APP_DATA, EMPTY_REVIEW_ARRAYS } from './data-types';
import {
  buildPreparedInitialLesson,
  selectReviewArrays,
  selectReviewAvailability,
} from './data-selectors';
import {
  buildDataPackage,
  DATA_PACKAGE_DEPENDENCIES,
  getDataPackageKey,
} from './data-package-builders';

type DataChangeMessage = Readonly<{
  source: string;
  userId: string;
  changes: AppDataChanges;
}>;

const EMPTY_STATE: DataManagerState = {
  ...EMPTY_APP_DATA,
  userId: null,
  status: 'idle',
  error: null,
  nowIso: new Date().toISOString(),
  localDate: getLocalDate(),
  reviewArrays: EMPTY_REVIEW_ARRAYS,
  nextInitialLesson: null,
  dataPackages: {},
};

const channelName = 'english-app-data-changes';
const sourceId = createSourceId();
const pendingChanges = new Map<string, AppDataChanges[]>();
let loadVersion = 0;
let currentLoad: { userId: string; promise: Promise<void> } | null = null;
let channel: BroadcastChannel | null = null;
let clockTimer: ReturnType<typeof setTimeout> | null = null;

const dataManagerStore = createStore<DataManagerState>(() => EMPTY_STATE);

// -- Account lifecycle and local snapshot --
/** Loads the active user's local dataset once and starts cross-tab change delivery. */
export function initializeDataManager(userId: string | null): Promise<void> {
  ensureChangeChannel();

  if (!userId) {
    resetDataManager();
    return Promise.resolve();
  }

  const currentState = dataManagerStore.getState();
  if (currentState.userId === userId && currentState.status === 'ready') {
    return Promise.resolve();
  }
  if (currentLoad?.userId === userId) return currentLoad.promise;

  const version = ++loadVersion;
  const clock = getClock();
  dataManagerStore.setState({
    ...EMPTY_APP_DATA,
    userId,
    status: 'loading',
    error: null,
    ...clock,
    reviewArrays: EMPTY_REVIEW_ARRAYS,
    nextInitialLesson: null,
    dataPackages: {},
  });

  const promise = loadSnapshot(userId)
    .then((snapshot) => {
      if (version !== loadVersion) return;
      dataManagerStore.setState({
        ...snapshot,
        userId,
        status: 'ready',
        error: null,
        ...getDerivedData(snapshot, userId),
        dataPackages: {},
      });
      applyPendingChanges(userId);
      scheduleClockUpdate();
    })
    .catch((caughtError: unknown) => {
      if (version !== loadVersion) return;
      const error = caughtError instanceof Error ? caughtError : new Error(String(caughtError));
      dataManagerStore.setState({
        ...EMPTY_APP_DATA,
        userId,
        status: 'error',
        error,
        ...getClock(),
        reviewArrays: EMPTY_REVIEW_ARRAYS,
        nextInitialLesson: null,
        dataPackages: {},
      });
      throw error;
    })
    .finally(() => {
      if (currentLoad?.promise === promise) currentLoad = null;
    });

  currentLoad = { userId, promise };
  return promise;
}

/** Waits for the active user's initial IndexedDB snapshot to be available. */
export function ensureDataManagerReady(userId: string): Promise<void> {
  return initializeDataManager(userId);
}

// -- Typed page-package cache --
/** Builds a requested page package once and keeps it subscribed to committed dataset changes. */
export async function ensureDataPackage<Request extends DataPackageRequest>(
  userId: string,
  request: Request,
): Promise<DataPackageValue<Request>> {
  const key = getDataPackageKey(request);
  const state = await getReadyDataManagerState(userId);
  const cached = state.dataPackages[key];
  if (cached) return getCachedPackageValue<Request>(cached);
  return buildAndCacheDataPackage(state, userId, request, key);
}

async function getReadyDataManagerState(userId: string): Promise<DataManagerState> {
  await ensureDataManagerReady(userId);
  const state = dataManagerStore.getState();
  if (state.userId !== userId || state.status !== 'ready') {
    throw state.error ?? new Error('Application data is not ready for the active user.');
  }
  return state;
}

function getCachedPackageValue<Request extends DataPackageRequest>(
  cached: DataManagerState['dataPackages'][string],
): DataPackageValue<Request> {
  if (cached.error) throw cached.error;
  return cached.data as DataPackageValue<Request>;
}

function buildAndCacheDataPackage<Request extends DataPackageRequest>(
  state: DataManagerState,
  userId: string,
  request: Request,
  key: string,
): DataPackageValue<Request> {
  try {
    const data = buildDataPackage(state, request);
    dataManagerStore.setState((current) => {
      if (current.userId !== userId || current.status !== 'ready') return current;
      if (current.dataPackages[key]) return current;
      return {
        ...current,
        dataPackages: {
          ...current.dataPackages,
          [key]: { request, data, error: null },
        },
      };
    });
    const latest = dataManagerStore.getState();
    const latestPackage = latest.userId === userId ? latest.dataPackages[key] : null;
    if (latestPackage) return getCachedPackageValue<Request>(latestPackage);
    throw new Error('The active account changed while preparing application data.');
  } catch (caughtError) {
    const error = caughtError instanceof Error ? caughtError : new Error(String(caughtError));
    dataManagerStore.setState((current) => {
      if (current.userId !== userId || current.status !== 'ready' || current.dataPackages[key]) return current;
      return {
        ...current,
        dataPackages: {
          ...current.dataPackages,
          [key]: { request, data: null, error },
        },
      };
    });
    throw error;
  }
}

export type DataPackageResult<Value> = Readonly<{
  status: 'loading' | 'ready' | 'error';
  data: Value | undefined;
  error: Error | null;
  userId: string | null;
}>;

/** Subscribes a page to the current user's cached package and its future updates. */
export function useDataPackage<Request extends DataPackageRequest>(
  request: Request,
): DataPackageResult<DataPackageValue<Request>> {
  const key = getDataPackageKey(request);
  return useStore(
    dataManagerStore,
    useShallow((state): DataPackageResult<DataPackageValue<Request>> => {
      if (state.status === 'error') {
        return { status: 'error', data: undefined, error: state.error, userId: state.userId };
      }
      if (state.status !== 'ready' || !state.userId) {
        return { status: 'loading', data: undefined, error: null, userId: state.userId };
      }
      const cached = state.dataPackages[key];
      if (!cached) return { status: 'loading', data: undefined, error: null, userId: state.userId };
      if (cached.error) {
        return { status: 'error', data: undefined, error: cached.error, userId: state.userId };
      }
      return {
        status: 'ready',
        data: cached.data as DataPackageValue<Request>,
        error: null,
        userId: state.userId,
      };
    }),
  );
}

/** Reads the current data-manager snapshot without exposing the underlying store. */
export function getDataManagerState(): DataManagerState {
  return dataManagerStore.getState();
}

/** Subscribes to state changes without exposing the underlying store API. */
export function subscribeToDataManager(
  listener: (state: DataManagerState) => void,
): () => void {
  return dataManagerStore.subscribe((state) => listener(state));
}

// -- Committed changes and cross-tab delivery --
/** Clears user data and invalidates any pending bootstrap for a previous account. */
export function resetDataManager(): void {
  loadVersion += 1;
  currentLoad = null;
  clearClockTimer();
  pendingChanges.clear();
  dataManagerStore.setState(EMPTY_STATE);
}

/** Applies committed IndexedDB changes and notifies other tabs. */
export function publishDataChanges(userId: string, changes: AppDataChanges): void {
  const currentState = dataManagerStore.getState();
  if (currentState.userId) applyChangesForActiveAccount(currentState.userId, userId, changes, currentState.status);

  channel?.postMessage({ source: sourceId, userId, changes } satisfies DataChangeMessage);
}

/** Combines table deltas while preserving the latest operation for every row key. */
export function mergeAppDataChanges(changes: readonly AppDataChanges[]): AppDataChanges {
  return changes.reduce((merged, change) => mergeChanges(merged, change), {} as AppDataChanges);
}

/** Applies a received cross-tab change without sending it back over the channel. */
export function applyRemoteDataChanges(userId: string, changes: AppDataChanges): void {
  const currentState = dataManagerStore.getState();
  if (!currentState.userId) return;
  applyChangesForActiveAccount(currentState.userId, userId, changes, currentState.status);
}

function applyChangesForActiveAccount(
  activeUserId: string,
  sourceUserId: string,
  changes: AppDataChanges,
  status: DataManagerState['status'],
): void {
  const applicableChanges = getAccountScopedChanges(activeUserId, sourceUserId, changes);
  if (!applicableChanges || !hasAppDataChanges(applicableChanges)) return;
  if (status === 'ready') applyChanges(applicableChanges);
  else if (status === 'loading') queueChanges(activeUserId, applicableChanges);
}

function getAccountScopedChanges(
  activeUserId: string,
  sourceUserId: string,
  changes: AppDataChanges,
): AppDataChanges | null {
  if (activeUserId === sourceUserId) return changes;

  const sharedChanges: AppDataChanges = {
    levels: changes.levels,
    lessons: changes.lessons,
    notes: changes.notes,
    groups: changes.groups,
    group_items: changes.group_items,
    group_relations: changes.group_relations,
  };
  return hasAppDataChanges(sharedChanges) ? sharedChanges : null;
}

function hasAppDataChanges(changes: AppDataChanges): boolean {
  return Object.values(changes).some((tableChanges) =>
    (tableChanges?.upserted?.length ?? 0) > 0 || (tableChanges?.deleted?.length ?? 0) > 0,
  );
}

function ensureChangeChannel(): void {
  if (channel || typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel(channelName);
  channel.addEventListener('message', (event: MessageEvent<DataChangeMessage>) => {
    const message = event.data;
    if (!message || message.source === sourceId || !message.userId || !message.changes) return;
    applyRemoteDataChanges(message.userId, message.changes);
  });
}

// -- Snapshot bootstrap and derived updates --
async function loadSnapshot(userId: string): Promise<AppDataSnapshot> {
  const [levels, lessons, notes, groups, groupItems, groupRelations, userItems, userLessons] =
    await Promise.all([
      db.levels.toArray(),
      db.lessons.toArray(),
      db.notes.toArray(),
      db.groups.toArray(),
      db.group_items.toArray(),
      db.group_relations.toArray(),
      db.user_items.where('user_id').equals(userId).toArray(),
      db.user_lessons.where('user_id').equals(userId).toArray(),
    ]);

  return {
    levels,
    lessons,
    notes,
    groups,
    group_items: groupItems,
    group_relations: groupRelations,
    user_items: userItems,
    user_lessons: userLessons,
  };
}

function queueChanges(userId: string, changes: AppDataChanges): void {
  const queued = pendingChanges.get(userId) ?? [];
  queued.push(changes);
  pendingChanges.set(userId, queued);
}

function applyPendingChanges(userId: string): void {
  const changes = pendingChanges.get(userId);
  if (!changes?.length) return;
  pendingChanges.delete(userId);
  const merged = changes.reduce((current, change) => mergeChanges(current, change), {} as AppDataChanges);
  applyChanges(merged);
}

function applyChanges(changes: AppDataChanges): void {
  dataManagerStore.setState((state) => {
    const snapshot = applyChangesToSnapshot(state, changes, state.userId ?? '');
    const nextState = {
      ...state,
      ...snapshot,
      ...getDerivedData(snapshot, state.userId ?? ''),
    };
    return {
      ...nextState,
      dataPackages: updateCachedPackages(state.dataPackages, nextState, changes),
    };
  });
  scheduleClockUpdate();
}

function applyChangesToSnapshot(
  state: AppDataSnapshot,
  changes: AppDataChanges,
  userId: string,
): AppDataSnapshot {
  return {
    levels: patchRows(state.levels, changes.levels, (row) => row.id),
    lessons: patchRows(state.lessons, changes.lessons, (row) => row.id),
    notes: patchRows(state.notes, changes.notes, (row) => row.id),
    groups: patchRows(state.groups, changes.groups, (row) => row.id),
    group_items: patchRows(state.group_items, changes.group_items, (row) => row.id),
    group_relations: patchRows(state.group_relations, changes.group_relations, (row) => row.id),
    user_items: patchRows(
      state.user_items,
      changes.user_items && {
        ...changes.user_items,
        upserted: changes.user_items.upserted?.filter((row) => row.user_id === userId),
      },
      (row) => row.item_id,
    ),
    user_lessons: patchRows(
      state.user_lessons,
      changes.user_lessons && {
        ...changes.user_lessons,
        upserted: changes.user_lessons.upserted?.filter((row) => row.user_id === userId),
      },
      getUserLessonKey,
    ),
  };
}

// -- Time-sensitive package refresh --
function scheduleClockUpdate(): void {
  clearClockTimer();
  const state = dataManagerStore.getState();
  if (state.status !== 'ready' || !state.userId) return;

  const now = new Date();
  const nextLocalDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const nextReviewAt = selectReviewAvailability(state, state.userId, now.toISOString()).nextReviewAt;
  const nextReviewTime = nextReviewAt === null ? Number.POSITIVE_INFINITY : Date.parse(nextReviewAt);
  const reviewDelay = Number.isFinite(nextReviewTime) && nextReviewTime > now.getTime()
    ? nextReviewTime - now.getTime() + 1
    : Number.POSITIVE_INFINITY;
  const delay = Math.min(
    config.practice.maxReviewReadyTimerDelayMs,
    Math.max(1, Math.min(reviewDelay, nextLocalDay - now.getTime())),
  );

  clockTimer = globalThis.setTimeout(() => {
    clockTimer = null;
    const clock = getClock();
    dataManagerStore.setState((current) => {
      const next = { ...current, ...clock };
      return {
        ...clock,
        dataPackages: updateCachedPackages(current.dataPackages, next, {}, true, current.localDate),
      };
    });
    scheduleClockUpdate();
  }, delay);
}

function clearClockTimer(): void {
  if (clockTimer === null) return;
  globalThis.clearTimeout(clockTimer);
  clockTimer = null;
}

// -- Derived state and cached-package invalidation --
function getDerivedData(snapshot: AppDataSnapshot, userId: string) {
  return {
    reviewArrays: selectReviewArrays(snapshot, userId),
    nextInitialLesson: buildPreparedInitialLesson(snapshot, userId),
  };
}

function updateCachedPackages(
  cachedPackages: DataManagerState['dataPackages'],
  state: DataManagerState,
  changes: AppDataChanges,
  clockChanged = false,
  previousLocalDate = state.localDate,
): DataManagerState['dataPackages'] {
  const changedTables = getChangedTables(changes);
  const affectedPackages = Object.entries(cachedPackages)
    .filter(([, cached]) => isDataPackageAffected(cached, state, changedTables, clockChanged, previousLocalDate));
  if (affectedPackages.length === 0) return cachedPackages;

  const updatedPackages = affectedPackages.map(([key, cached]) => [key, rebuildCachedDataPackage(cached, state)]);
  return { ...cachedPackages, ...Object.fromEntries(updatedPackages) };
}

function isDataPackageAffected(
  cached: DataManagerState['dataPackages'][string],
  state: DataManagerState,
  changedTables: ReadonlySet<keyof AppDataSnapshot>,
  clockChanged: boolean,
  previousLocalDate: string,
): boolean {
  const dependencies = DATA_PACKAGE_DEPENDENCIES[cached.request.kind];
  if (dependencies.tables.some((table) => changedTables.has(table))) return true;
  if (!clockChanged) return false;
  return dependencies.clock === true ||
    (dependencies.localDate === true && state.localDate !== previousLocalDate);
}

function rebuildCachedDataPackage(
  cached: DataManagerState['dataPackages'][string],
  state: DataManagerState,
): DataManagerState['dataPackages'][string] {
  try {
    return { request: cached.request, data: buildDataPackage(state, cached.request), error: null };
  } catch (caughtError) {
    return {
      request: cached.request,
      data: null,
      error: caughtError instanceof Error ? caughtError : new Error(String(caughtError)),
    };
  }
}

function getChangedTables(changes: AppDataChanges): Set<keyof AppDataSnapshot> {
  return new Set(
    Object.entries(changes)
      .filter(([, delta]) => (delta?.upserted?.length ?? 0) > 0 || (delta?.deleted?.length ?? 0) > 0)
      .map(([table]) => table as keyof AppDataSnapshot),
  );
}

// -- Immutable row-change helpers --
function patchRows<Row, Key>(
  rows: readonly Row[],
  changes: { upserted?: readonly Row[]; deleted?: readonly Key[] } | undefined,
  getKey: (row: Row) => Key,
): readonly Row[] {
  if (!changes) return rows;
  const byKey = new Map(rows.map((row) => [getKey(row), row]));
  for (const row of changes.upserted ?? []) byKey.set(getKey(row), row);
  for (const key of changes.deleted ?? []) byKey.delete(key);
  return [...byKey.values()];
}

function mergeChanges(left: AppDataChanges, right: AppDataChanges): AppDataChanges {
  return {
    levels: mergeTableChanges(left.levels, right.levels, (row) => row.id),
    lessons: mergeTableChanges(left.lessons, right.lessons, (row) => row.id),
    notes: mergeTableChanges(left.notes, right.notes, (row) => row.id),
    groups: mergeTableChanges(left.groups, right.groups, (row) => row.id),
    group_items: mergeTableChanges(left.group_items, right.group_items, (row) => row.id),
    group_relations: mergeTableChanges(left.group_relations, right.group_relations, (row) => row.id),
    user_items: mergeTableChanges(left.user_items, right.user_items, (row) => row.item_id),
    user_lessons: mergeTableChanges(left.user_lessons, right.user_lessons, getUserLessonKey),
  };
}

function mergeTableChanges<Row, Key>(
  left: { upserted?: readonly Row[]; deleted?: readonly Key[] } | undefined,
  right: { upserted?: readonly Row[]; deleted?: readonly Key[] } | undefined,
  getKey: (row: Row) => Key,
) {
  if (!left) return right;
  if (!right) return left;
  const operations = new Map<Key, { row: Row } | null>();
  for (const changes of [left, right]) {
    for (const row of changes.upserted ?? []) operations.set(getKey(row), { row });
    for (const key of changes.deleted ?? []) operations.set(key, null);
  }
  return {
    upserted: [...operations.values()].flatMap((operation) => operation ? [operation.row] : []),
    deleted: [...operations].flatMap(([key, operation]) => operation ? [] : [key]),
  };
}

function getUserLessonKey(row: { user_id: string; lesson_id: number; started_at: string }): string {
  return `${row.user_id}:${row.lesson_id}:${row.started_at}`;
}

function createSourceId(): string {
  return globalThis.crypto.randomUUID();
}

function getClock(): Pick<DataManagerState, 'nowIso' | 'localDate'> {
  const now = new Date();
  return {
    nowIso: now.toISOString(),
    localDate: getLocalDate(now),
  };
}

function getLocalDate(date = new Date()): string {
  return date.toLocaleDateString('en-CA');
}
