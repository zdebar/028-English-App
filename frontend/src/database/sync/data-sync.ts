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
import { reportInfo } from '@/features/logging/monitoring-handler';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { settleSyncWithAuthRecovery } from './auth-recovery';

/**
 * Synchronizes shared and user-specific tables with Supabase.
 *
 * @param userId Non-empty user id used for user-specific tables.
 * @throws Error when userId is empty or any table sync task fails.
 */
export async function dataSync(userId: string): Promise<void> {
  assertNonEmptyString(userId, 'userId');

  initDbMappings();
  // Sync shared reference data and user-owned progress in parallel.
  const syncTasks = [
    { tableName: 'Groups', sync: () => Groups.syncFromRemote() },
    { tableName: 'GroupItems', sync: () => GroupItem.syncFromRemote() },
    { tableName: 'GroupRelations', sync: () => GroupRelation.syncFromRemote() },
    { tableName: 'Levels', sync: () => Levels.syncFromRemote() },
    { tableName: 'Lessons', sync: () => Lessons.syncFromRemote() },
    { tableName: 'Notes', sync: () => Notes.syncFromRemote() },
    { tableName: 'UserItems', sync: () => UserItem.syncFromRemote(userId) },
    { tableName: 'UserLessons', sync: () => UserLesson.syncFromRemote(userId) },
  ];

  const results = await settleSyncWithAuthRecovery(
    userId,
    syncTasks.map(({ sync }) => sync),
  );

  // Report per-table completion counts when available (most syncFromRemote return number of items).
  results.forEach((result, index) => {
    const task = syncTasks[index];
    if (!task || result.status !== 'fulfilled' || typeof result.value !== 'number') {
      return;
    }

    try {
      reportInfo(`Completed ${result.value} ${task.tableName} pull from remote.`);
    } catch {
      // Swallow logging errors so they do not affect synchronization.
    }
  });

  const summary = summarizeSettledResults(results, 'Data sync', 3, false);

  if (summary.failed > 0) {
    throw new Error('Data synchronization error');
  }
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

  const results = await settleSyncWithAuthRecovery(userId, [
    () => UserItem.syncFromRemote(userId),
    () => UserLesson.syncFromRemote(userId),
  ]);

  if (results.some((r) => r.status === 'rejected')) {
    throw new Error('Session end synchronization failed');
  }
}
