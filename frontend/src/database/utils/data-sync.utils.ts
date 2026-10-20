import config from '@/config/config';
import { initDbMappings } from '@/database/models/db-init';
import UserItem from '@/database/models/user-items';
import { getFullSyncTime, setFullSyncTime } from '@/database/utils/sync-time.utils';
import { withSettledSummary } from '@/features/logging/logging.utils';
import Lessons from '@/database/models/lessons';
import Levels from '@/database/models/levels';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { supabaseInstance } from '@/config/supabase.config';
import Notes from '../models/notes';
import UserLesson from '../models/user-lessons';
import UserSettings from '../models/user-settings';
import Groups from '../models/groups';
import GroupItem from '../models/group-items';
import GroupRelation from '../models/group-relations';
import { settleSyncWithAuthRecovery } from './sync-auth-recovery.utils';

/**
 * Synchronizes shared and user-specific tables with Supabase.
 *
 * @param userId Non-empty user id used for user-specific tables.
 * @param fullSync When true, forces all sync tasks to use the epoch start timestamp and refresh local rows.
 * When false, a full sync is selected only after the configured full-sync interval expires.
 * @throws Error when userId is empty or any table sync task fails.
 */
export async function dataSync(userId: string, fullSync: boolean = false): Promise<void> {
  assertNonEmptyString(userId, 'userId');

  initDbMappings();
  // Step 1: Determine if a full sync is needed
  const now = Date.now();
  let doFullSync = fullSync;
  if (!fullSync) {
    const lastFullSync = getFullSyncTime(userId);
    doFullSync = now - lastFullSync > config.sync.fullSyncInterval;
  }

  // Step 2: Perform shared stores data synchronization (grammar and audio metadata)
  const tasks = [
    () => Groups.syncFromRemote(doFullSync),
    () => GroupItem.syncFromRemote(doFullSync),
    () => GroupRelation.syncFromRemote(doFullSync),
    () => Levels.syncFromRemote(doFullSync),
    () => Lessons.syncFromRemote(doFullSync),
    () => Notes.syncFromRemote(doFullSync),
    () => UserItem.syncFromRemote(userId, doFullSync),
    () => UserLesson.syncFromRemote(userId, doFullSync),
    () => UserSettings.syncFromRemote(userId),
  ];

  // Keep a parallel list of human-readable table names to report per-table completions.
  const tableNames = [
    'Groups',
    'GroupItems',
    'GroupRelations',
    'Levels',
    'Lessons',
    'Notes',
    'UserItems',
    'UserLessons',
    'UserSettings',
  ];

  const results = await settleSyncWithAuthRecovery(userId, tasks);

  // Report per-table completion counts when available (most syncFromRemote return number of items)
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      const val = r.value as unknown;
      if (typeof val === 'number') {
        try {
          reportInfo(`Completed ${val} ${tableNames[idx]} pull from remote.`);
        } catch {
          // swallow logging errors
        }
      }
    }
  });

  const finalPromises = results.map((result) => {
    if (result.status === 'fulfilled') return Promise.resolve(result.value);
    return Promise.reject(result.reason);
  });
  const summary = await withSettledSummary(finalPromises, 'Data sync', 3, false);

  if (summary.failed > 0) {
    throw new Error('Data synchronization error');
  }
  if (doFullSync) {
    setFullSyncTime(userId, now);
  }
}

/**
 * Performs a best-effort incremental sync for user-owned tables during unmount.
 *
 * @param userId User id whose personal data should sync.
 * @returns Resolves without syncing when there is no active Supabase session.
 * @throws Error when at least one unmount sync task rejects.
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  const { data: sessionData } = await supabaseInstance.auth.getSession();
  if (!sessionData.session) {
    return;
  }

  const results = await settleSyncWithAuthRecovery(userId, [
    () => UserItem.syncFromRemote(userId, false),
    () => UserLesson.syncFromRemote(userId, false),
    () => UserSettings.syncFromRemote(userId),
  ]);

  if (results.some((r) => r.status === 'rejected')) {
    throw new Error('Unmount synchronization failed');
  }
}
