import config from '@/config/config';
import AudioRecord from '@/database/models/audio-records';
import {
  DATA_SYNC_TABLES,
  syncDataTables,
  type DataSyncTable,
} from '@/database/sync/data-sync';
import { reportError, reportInfo } from '@/features/logging/logging-handler';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';
import { useSyncStore } from './use-sync-store';

const QUICK_RETRY_DELAYS_MS = [1_000, 3_000] as const;
const SCHEDULED_RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000] as const;
const AUDIO_ARCHIVES_TASK = 'audio-archives';
const ORPHANED_AUDIO_TASK = 'orphaned-audio';
const AUDIO_ARCHIVE_TASK_PREFIX = 'audio-archive:';

type AudioArchiveTask = `${typeof AUDIO_ARCHIVE_TASK_PREFIX}${string}`;
type SyncTaskId = DataSyncTable | typeof AUDIO_ARCHIVES_TASK | typeof ORPHANED_AUDIO_TASK | AudioArchiveTask;
type TaskErrors = readonly unknown[];

type SyncTaskOutcomes = ReadonlyMap<SyncTaskId, TaskErrors | null>;

type InFlightSync = Readonly<{
  userId: string;
  promise: Promise<void>;
}>;

class SyncOfflineError extends Error {
  constructor() {
    super('Synchronization is waiting for a network connection.');
    this.name = 'SyncOfflineError';
  }
}

/** Owns the scheduled sync work and retry state for one application lifecycle. */
export class SyncManager {
  private activeUserId: string | null = null;
  private inFlightSync: InFlightSync | null = null;
  private initialSyncTimer: ReturnType<typeof setTimeout> | null = null;
  private periodicSyncTimer: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private cancelPendingDelay: (() => void) | null = null;
  private onlineListener: (() => void) | null = null;
  private retryAttempt = 0;
  private hasShownFailureToast = false;
  private readonly failuresByTask = new Map<SyncTaskId, TaskErrors>();
  private readonly reportedFailureKeys = new Set<string>();

  /** Starts scheduled synchronization for the authenticated user. */
  start(userId: string | null): void {
    if (this.activeUserId === userId) return;
    this.stopTimers();
    this.activeUserId = userId;
    this.failuresByTask.clear();
    this.reportedFailureKeys.clear();
    this.retryAttempt = 0;
    this.hasShownFailureToast = false;
    useSyncStore.getState().resetSyncState();

    if (!userId) return;

    useSyncStore.getState().setSynchronizing(true);
    this.initialSyncTimer = globalThis.setTimeout(() => {
      void this.requestSync(userId, ...DATA_SYNC_TABLES, AUDIO_ARCHIVES_TASK, ORPHANED_AUDIO_TASK)
        .catch((error: unknown) => reportError('Failed to start data synchronization', error));
    }, 3_000);
    this.periodicSyncTimer = globalThis.setInterval(() => {
      void this.requestSync(userId, ...DATA_SYNC_TABLES, AUDIO_ARCHIVES_TASK, ORPHANED_AUDIO_TASK)
        .catch((error: unknown) => reportError('Failed to start data synchronization', error));
    }, config.sync.periodicSyncInterval);

    this.onlineListener = () => {
      if (!isOnline() || !this.isActiveUser(userId)) return;
      const retryableTasks = this.getRetryableTaskIds();
      if (retryableTasks.length === 0) return;
      this.clearRetryTimer();
      void this.requestSync(userId, ...retryableTasks)
        .catch((error: unknown) => reportError('Failed to retry data synchronization', error));
    };
    globalThis.addEventListener?.('online', this.onlineListener);
  }

  /** Stops timers and retries, optionally guarding against stale lifecycle cleanup. */
  stop(expectedUserId?: string | null): void {
    if (expectedUserId !== undefined && expectedUserId !== this.activeUserId) return;
    this.stopTimers();
    this.activeUserId = null;
    this.failuresByTask.clear();
    this.reportedFailureKeys.clear();
    this.retryAttempt = 0;
    this.hasShownFailureToast = false;
    useSyncStore.getState().resetSyncState();
  }

  /** Returns the active run so callers can wait before session-end synchronization. */
  waitForIdle(): Promise<void> | null {
    return this.inFlightSync?.promise ?? null;
  }

  private requestSync(userId: string, ...requestedTasks: readonly SyncTaskId[]): Promise<void> {
    if (!this.isActiveUser(userId) || requestedTasks.length === 0) return Promise.resolve();
    if (this.inFlightSync) {
      if (this.inFlightSync.userId === userId) return this.inFlightSync.promise;
      return this.inFlightSync.promise.then(() => this.requestSync(userId, ...requestedTasks));
    }

    const promise = this.performSync(userId, requestedTasks)
      .catch((error: unknown) => {
        reportError('Unexpected synchronization manager error', error);
      });
    let trackedSync: InFlightSync | null = null;
    const trackedPromise = promise.finally(() => {
      if (this.inFlightSync === trackedSync) this.inFlightSync = null;
    });
    trackedSync = { userId, promise: trackedPromise };
    this.inFlightSync = trackedSync;
    return trackedPromise;
  }

  private async performSync(userId: string, requestedTasks: readonly SyncTaskId[]): Promise<void> {
    if (!this.isActiveUser(userId)) return;
    useSyncStore.getState().setSynchronizing(true);

    const pendingTasks = [...new Set(requestedTasks)];
    if (!isOnline()) {
      this.applyTaskOutcomes(userId, new Map(pendingTasks.map((task) => [task, [new SyncOfflineError()]])));
      this.finishSyncState(userId);
      return;
    }

    for (let attempt = 0; attempt <= QUICK_RETRY_DELAYS_MS.length; attempt += 1) {
      if (attempt > 0) {
        const retryDelay = this.getQuickRetryDelay(pendingTasks, attempt - 1);
        await this.delay(retryDelay);
        if (!this.isActiveUser(userId)) return;
        if (!isOnline()) {
          this.applyTaskOutcomes(userId, new Map(pendingTasks.map((task) => [task, [new SyncOfflineError()]])));
          break;
        }
      }

      const outcomes = await runTaskBatch(userId, pendingTasks);
      if (!this.isActiveUser(userId)) return;
      this.applyTaskOutcomes(userId, outcomes);

      const retryableTasks = [...outcomes.keys()].filter((task) => {
        const errors = this.failuresByTask.get(task);
        return errors?.some(isRetryableSyncError) ?? false;
      });
      pendingTasks.splice(0, pendingTasks.length, ...retryableTasks);
      if (pendingTasks.length === 0) break;
    }

    this.finishSyncState(userId);
  }

  private applyTaskOutcomes(userId: string, outcomes: SyncTaskOutcomes): void {
    if (!this.isActiveUser(userId)) return;

    if (outcomes.has(AUDIO_ARCHIVES_TASK)) this.clearAudioArchiveFailures();
    for (const [task, errors] of outcomes) {
      if (errors?.length) this.failuresByTask.set(task, errors);
      else this.failuresByTask.delete(task);
    }
  }

  private finishSyncState(userId: string): void {
    if (!this.isActiveUser(userId)) return;

    const failedTasks = [...this.failuresByTask.keys()];
    const retryableTasks = this.getRetryableTaskIds();
    const isSuccessful = failedTasks.length === 0;
    const retryAt = retryableTasks.length > 0 && isOnline()
      ? Date.now() + this.getScheduledRetryDelay()
      : null;

    useSyncStore.getState().setSynchronized(isSuccessful);
    useSyncStore.getState().setSyncError(!isSuccessful);
    useSyncStore.getState().setSyncDetails(failedTasks, retryAt);
    useSyncStore.getState().setSynchronizing(false);

    if (isSuccessful) {
      this.retryAttempt = 0;
      this.hasShownFailureToast = false;
      this.reportedFailureKeys.clear();
      this.clearRetryTimer();
      useToastStore.getState().showToast(TEXTS.syncSuccessToast, 'success');
      return;
    }

    this.reportUnreportedFailures();
    if (!this.hasShownFailureToast) {
      useToastStore.getState().showToast(TEXTS.syncErrorToast, 'error');
      this.hasShownFailureToast = true;
    }

    if (retryableTasks.length > 0) this.scheduleRetry(userId);
    else this.clearRetryTimer();
  }

  private reportUnreportedFailures(): void {
    for (const [task, errors] of this.failuresByTask) {
      for (const error of errors) {
        if (error instanceof SyncOfflineError) continue;
        const key = `${task}:${getErrorMessage(error)}`;
        if (this.reportedFailureKeys.has(key)) continue;
        this.reportedFailureKeys.add(key);
        reportError(`Synchronization task failed: ${task}`, error);
      }
    }
  }

  private scheduleRetry(userId: string): void {
    this.clearRetryTimer();
    if (!isOnline() || !this.isActiveUser(userId)) return;
    const retryDelay = this.getScheduledRetryDelay();
    useSyncStore.getState().setSyncDetails([...this.failuresByTask.keys()], Date.now() + retryDelay);
    this.retryTimer = globalThis.setTimeout(() => {
      this.retryTimer = null;
      if (!this.isActiveUser(userId)) return;
      void this.requestSync(userId, ...this.getRetryableTaskIds())
        .catch((error: unknown) => reportError('Scheduled synchronization retry failed', error));
    }, retryDelay);
    this.retryAttempt = Math.min(this.retryAttempt + 1, SCHEDULED_RETRY_DELAYS_MS.length - 1);
  }

  private getRetryableTaskIds(): SyncTaskId[] {
    return [...this.failuresByTask.entries()]
      .filter(([, errors]) => errors.some(isRetryableSyncError))
      .map(([task]) => task);
  }

  private getScheduledRetryDelay(): number {
    const defaultDelay = SCHEDULED_RETRY_DELAYS_MS[this.retryAttempt] ??
      SCHEDULED_RETRY_DELAYS_MS.at(-1) ??
      15 * 60_000;
    const retryAfterDelays = [...this.failuresByTask.values()]
      .flatMap((errors) => errors.filter(isRetryableSyncError))
      .map(getRetryAfterMs)
      .filter((delayMs): delayMs is number => delayMs !== null);
    return Math.max(defaultDelay, ...retryAfterDelays);
  }

  private getQuickRetryDelay(tasks: readonly SyncTaskId[], retryIndex: number): number {
    const defaultDelay = QUICK_RETRY_DELAYS_MS[retryIndex] ?? 0;
    const retryAfter = tasks.flatMap((task) => this.failuresByTask.get(task) ?? [])
      .filter(isRetryableSyncError)
      .map(getRetryAfterMs)
      .filter((delayMs): delayMs is number => delayMs !== null);
    return Math.max(defaultDelay, ...retryAfter);
  }

  private clearAudioArchiveFailures(): void {
    for (const task of this.failuresByTask.keys()) {
      if (task === AUDIO_ARCHIVES_TASK || isAudioArchiveTask(task)) this.failuresByTask.delete(task);
    }
  }

  private stopTimers(): void {
    if (this.initialSyncTimer !== null) globalThis.clearTimeout(this.initialSyncTimer);
    if (this.periodicSyncTimer !== null) globalThis.clearInterval(this.periodicSyncTimer);
    this.clearRetryTimer();
    this.cancelPendingDelay?.();
    if (this.onlineListener) globalThis.removeEventListener?.('online', this.onlineListener);
    this.initialSyncTimer = null;
    this.periodicSyncTimer = null;
    this.onlineListener = null;
  }

  private clearRetryTimer(): void {
    if (this.retryTimer !== null) globalThis.clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private isActiveUser(userId: string): boolean {
    return this.activeUserId === userId;
  }

  private delay(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      const finish = () => {
        if (timeout !== null) globalThis.clearTimeout(timeout);
        if (this.cancelPendingDelay === finish) this.cancelPendingDelay = null;
        resolve();
      };

      timeout = globalThis.setTimeout(finish, delayMs);
      this.cancelPendingDelay = finish;
    });
  }
}

/** Shared app instance; tests or other isolated lifecycles can construct their own. */
export const syncManager = new SyncManager();

// -- Failure classification and sync requests --
/** Returns whether a failed sync task should receive automatic retry attempts. */
export function isRetryableSyncError(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  let hasTransientNetworkError = false;

  while (isErrorLike(current) && !visited.has(current)) {
    visited.add(current);
    if (isPermanentAuthError(current)) return false;
    if (hasRetryableStatus(current)) return true;
    if (hasPermanentClientError(current)) return false;
    hasTransientNetworkError ||= hasRetryableNetworkError(current);

    current = getProperty(current, 'cause');
  }

  return hasTransientNetworkError || error instanceof SyncOfflineError;
}

// -- Sync execution --
async function runTaskBatch(userId: string, tasks: readonly SyncTaskId[]): Promise<SyncTaskOutcomes> {
  const outcomes = new Map<SyncTaskId, TaskErrors | null>();
  const dataTables = tasks.filter(isDataSyncTable);

  if (dataTables.length > 0) {
    try {
      const results = await syncDataTables(userId, dataTables);
      for (const { table, result } of results) {
        outcomes.set(table, result.status === 'rejected' ? [result.reason] : null);
      }
    } catch (error) {
      for (const table of dataTables) outcomes.set(table, [error]);
    }
  }

  await runAudioArchiveTasks(tasks, outcomes);
  await runOrphanedAudioTask(tasks, outcomes);
  return outcomes;
}

async function runAudioArchiveTasks(
  tasks: readonly SyncTaskId[],
  outcomes: Map<SyncTaskId, TaskErrors | null>,
): Promise<void> {
  const request = getAudioArchiveRequest(tasks);
  if (!request) return;
  try {
    const summary = await AudioRecord.syncFromRemote(request.archiveNames);
    applyAudioArchiveSummary(request, summary, outcomes);
  } catch (error) {
    outcomes.set(AUDIO_ARCHIVES_TASK, [error]);
  }
}

function getAudioArchiveRequest(tasks: readonly SyncTaskId[]): Readonly<{
  archiveNames: readonly string[] | undefined;
  selectedArchiveTasks: readonly AudioArchiveTask[];
  runAll: boolean;
}> | null {
  const runAll = tasks.includes(AUDIO_ARCHIVES_TASK);
  const selectedArchiveTasks = runAll ? [] : tasks.filter(isAudioArchiveTask);
  if (!runAll && selectedArchiveTasks.length === 0) return null;
  return {
    archiveNames: runAll ? undefined : selectedArchiveTasks.map(getAudioArchiveName),
    selectedArchiveTasks,
    runAll,
  };
}

function applyAudioArchiveSummary(
  request: NonNullable<ReturnType<typeof getAudioArchiveRequest>>,
  summary: Awaited<ReturnType<typeof AudioRecord.syncFromRemote>>,
  outcomes: Map<SyncTaskId, TaskErrors | null>,
): void {
  if (request.runAll) outcomes.set(AUDIO_ARCHIVES_TASK, null);
  for (const task of request.selectedArchiveTasks) outcomes.set(task, null);
  for (const failedArchive of summary.failedArchives) {
    outcomes.set(getAudioArchiveTaskId(failedArchive.archiveName), [failedArchive.error]);
  }

  if (summary.failed === 0 || summary.failedArchives.length > 0) return;
  const errors = getSummaryErrors(summary, 'Audio archive synchronization failed.');
  const failedTask = request.runAll
    ? AUDIO_ARCHIVES_TASK
    : getAudioArchiveTaskId(request.archiveNames?.[0] ?? '');
  outcomes.set(failedTask, errors);
}

async function runOrphanedAudioTask(
  tasks: readonly SyncTaskId[],
  outcomes: Map<SyncTaskId, TaskErrors | null>,
): Promise<void> {
  if (!tasks.includes(ORPHANED_AUDIO_TASK)) return;

  try {
    const summary = await AudioRecord.removeOrphaned();
    if (summary.failed > 0) {
      outcomes.set(ORPHANED_AUDIO_TASK, getSummaryErrors(summary, 'Removing orphaned audio failed.'));
      return;
    }
    outcomes.set(ORPHANED_AUDIO_TASK, null);
    if (summary.success > 0) reportInfo(`Deleted ${summary.success} orphaned audio records.`);
  } catch (error) {
    outcomes.set(ORPHANED_AUDIO_TASK, [error]);
  }
}

// -- Retry timing and error parsing --
function getRetryAfterMs(error: unknown): number | null {
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (isErrorLike(current) && !visited.has(current)) {
    visited.add(current);
    const explicitDelay = getNumericProperty(current, 'retryAfterMs');
    if (explicitDelay !== undefined) return Math.max(0, explicitDelay);
    const retryAfterDelay = parseRetryAfter(getProperty(current, 'retryAfter'));
    if (retryAfterDelay !== null) return retryAfterDelay;
    const headerDelay = getRetryAfterHeader(current);
    if (headerDelay !== null) return headerDelay;
    current = getProperty(current, 'cause');
  }

  return null;
}

function getRetryAfterHeader(error: Record<string, unknown>): number | null {
  const headers = getProperty(error, 'headers');
  if (typeof headers !== 'object' || headers === null || !('get' in headers) || typeof headers.get !== 'function') {
    return null;
  }
  return parseRetryAfter(headers.get('Retry-After'));
}

function parseRetryAfter(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value * 1_000);
  if (typeof value !== 'string') return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
  const dateDelay = Date.parse(value) - Date.now();
  return Number.isFinite(dateDelay) ? Math.max(0, dateDelay) : null;
}

function isPermanentAuthError(error: Record<string, unknown>): boolean {
  const code = getStringProperty(error, 'code');
  const status = getNumericProperty(error, 'status') ?? getNumericProperty(error, 'statusCode');
  return code === 'PGRST303' || status === 401 || status === 403;
}

function hasRetryableStatus(error: Record<string, unknown>): boolean {
  const status = getNumericProperty(error, 'status') ?? getNumericProperty(error, 'statusCode');
  return status === 408 || status === 425 || status === 429 || (status !== undefined && status >= 500);
}

function hasPermanentClientError(error: Record<string, unknown>): boolean {
  const status = getNumericProperty(error, 'status') ?? getNumericProperty(error, 'statusCode');
  return status !== undefined && status >= 400 && status < 500;
}

function hasRetryableNetworkError(error: Record<string, unknown>): boolean {
  const code = getStringProperty(error, 'code') ?? '';
  if (/^(ECONN|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|UND_ERR)/i.test(code)) return true;
  const message = getStringProperty(error, 'message') ?? '';
  const hasCause = getProperty(error, 'cause') !== undefined;
  return /network|timed? ?out|connection (reset|closed|refused)|temporarily unavailable/i.test(message) ||
    (!hasCause && /failed to fetch/i.test(message));
}

// -- Task identifiers and lifecycle cleanup --
function isDataSyncTable(task: SyncTaskId): task is DataSyncTable {
  return DATA_SYNC_TABLES.includes(task as DataSyncTable);
}

function isAudioArchiveTask(task: SyncTaskId): task is AudioArchiveTask {
  return task.startsWith(AUDIO_ARCHIVE_TASK_PREFIX);
}

function getAudioArchiveTaskId(archiveName: string): AudioArchiveTask {
  return `${AUDIO_ARCHIVE_TASK_PREFIX}${archiveName}`;
}

function getAudioArchiveName(task: AudioArchiveTask): string {
  return task.slice(AUDIO_ARCHIVE_TASK_PREFIX.length);
}

function getSummaryErrors(
  summary: { errors?: unknown[]; sampleErrors?: unknown[] },
  fallbackMessage: string,
): TaskErrors {
  return summary.errors ?? summary.sampleErrors ?? [new Error(fallbackMessage)];
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

function isErrorLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getProperty(value: Record<string, unknown>, key: string): unknown {
  return value[key];
}

function getStringProperty(value: Record<string, unknown>, key: string): string | undefined {
  const property = getProperty(value, key);
  return typeof property === 'string' ? property : undefined;
}

function getNumericProperty(value: Record<string, unknown>, key: string): number | undefined {
  const property = getProperty(value, key);
  const numericValue = typeof property === 'string' ? Number(property) : property;
  return typeof numericValue === 'number' && Number.isFinite(numericValue) ? numericValue : undefined;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}