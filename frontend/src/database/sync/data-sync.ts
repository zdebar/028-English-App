import { initDbMappings } from '@/database/models/db-init';
import GroupItem from '@/database/models/group-items';
import GroupRelation from '@/database/models/group-relations';
import Groups from '@/database/models/groups';
import Lessons from '@/database/models/lessons';
import Levels from '@/database/models/levels';
import Notes from '@/database/models/notes';
import UserItem from '@/database/models/user-items';
import UserLesson from '@/database/models/user-lessons';
import { supabaseInstance } from '@/config/supabase.config';
import { summarizeSettledResults } from '@/features/logging/logging.utils';
import { reportInfo } from '@/features/logging/logging-handler';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { settleSyncWithAuthRecovery } from './auth-recovery';
import type { AppDataSyncResult } from '@/database/state/data-types';
import { mergeAppDataChanges, publishDataChanges } from '@/database/state/data-store';

export const DATA_SYNC_TABLES = [
  'Groups',
  'GroupItems',
  'GroupRelations',
  'Levels',
  'Lessons',
  'Notes',
  'UserItems',
  'UserLessons',
] as const;

export type DataSyncTable = (typeof DATA_SYNC_TABLES)[number];

export type DataSyncTaskResult = Readonly<{
  table: DataSyncTable;
  result: PromiseSettledResult<AppDataSyncResult>;
}>;

/**
 * Synchronizes shared and user-specific tables with Supabase.
 *
 * @param userId Non-empty user id used for user-specific tables.
 * @throws Error when userId is empty or any table sync task fails.
 */
export async function dataSync(userId: string): Promise<void> {
  const outcomes = await syncDataTables(userId);
  const results = outcomes.map(({ result }) => result);
  const summary = summarizeSettledResults(results, 'Data sync', 3, false);
  if (summary.failed > 0) throw new Error('Data synchronization error');
}

/** Runs selected table sync tasks and returns each outcome for centralized retry handling. */
export async function syncDataTables(
  userId: string,
  tables: readonly DataSyncTable[] = DATA_SYNC_TABLES,
): Promise<DataSyncTaskResult[]> {
  assertNonEmptyString(userId, 'userId');
  if (tables.length === 0) return [];

  initDbMappings();
  const syncTasks = getSyncTasks(userId);
  const selectedTasks = syncTasks.filter((task) => tables.includes(task.table));
  const results = await settleSyncWithAuthRecovery(
    userId,
    selectedTasks.map(({ sync }) => sync),
  );

  publishSuccessfulChanges(userId, results);
  reportCompletedTableSyncs(selectedTasks, results);

  return selectedTasks.map((task, index) => ({
    table: task.table,
    result: results[index] ?? { status: 'rejected', reason: new Error(`Missing result for ${task.table}.`) },
  }));
}

/**
 * Performs a best-effort incremental sync for user-owned tables before the active session ends.
 *
 * @param userId User id whose personal data should sync.
 * @returns Resolves without syncing when there is no active Supabase session.
 * @throws Error when at least one sync task rejects.
 */
export async function dataSyncBeforeSessionEnd(userId: string): Promise<void> {
  const { data: sessionData } = await supabaseInstance.auth.getSession();
  if (!sessionData.session) {
    return;
  }

  const outcomes = await syncDataTables(userId, ['UserItems', 'UserLessons']);
  if (outcomes.some(({ result }) => result.status === 'rejected')) {
    throw new Error('Session end synchronization failed');
  }
}

function getSyncTasks(userId: string) {
  return [
    { table: 'Groups', sync: () => Groups.syncFromRemote() },
    { table: 'GroupItems', sync: () => GroupItem.syncFromRemote() },
    { table: 'GroupRelations', sync: () => GroupRelation.syncFromRemote() },
    { table: 'Levels', sync: () => Levels.syncFromRemote() },
    { table: 'Lessons', sync: () => Lessons.syncFromRemote() },
    { table: 'Notes', sync: () => Notes.syncFromRemote() },
    { table: 'UserItems', sync: () => UserItem.syncFromRemote(userId) },
    { table: 'UserLessons', sync: () => UserLesson.syncFromRemote(userId) },
  ] satisfies Array<{ table: DataSyncTable; sync: () => Promise<AppDataSyncResult> }>;
}

function reportCompletedTableSyncs(
  tasks: ReturnType<typeof getSyncTasks>,
  results: readonly PromiseSettledResult<AppDataSyncResult>[],
): void {
  results.forEach((result, index) => {
    const task = tasks[index];
    if (!task || result.status !== 'fulfilled') return;

    try {
      reportInfo(`Completed ${result.value.count} ${task.table} pull from remote.`);
    } catch {
      // Swallow logging errors so they do not affect synchronization.
    }
  });
}

function publishSuccessfulChanges(
  userId: string,
  results: readonly PromiseSettledResult<unknown>[],
): void {
  const changes = results.flatMap((result) =>
    result.status === 'fulfilled' && isSyncResult(result.value) && hasChanges(result.value.changes)
      ? [result.value.changes]
      : [],
  );
  if (changes.length > 0) publishDataChanges(userId, mergeAppDataChanges(changes));
}

function isSyncResult(value: unknown): value is AppDataSyncResult {
  return typeof value === 'object' && value !== null && 'count' in value && 'changes' in value;
}

function hasChanges(changes: AppDataSyncResult['changes']): boolean {
  return Object.values(changes).some((tableChanges) =>
    (tableChanges?.upserted?.length ?? 0) > 0 || (tableChanges?.deleted?.length ?? 0) > 0,
  );
}
