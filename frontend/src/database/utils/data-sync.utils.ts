import config from '@/config/config';
import { initDbMappings } from '@/database/models/db-init';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import UserScoreType from '@/database/models/user-scores';
import { restoreUnsavedFromLocalStorage } from '@/database/utils/database.utils';
import { getFullSyncTime, setFullSyncTime } from '@/database/utils/sync-time.utils';
import { withSettledSummary } from '@/features/logging/logging.utils';
import Lessons from '@/database/models/lessons';
import Levels from '@/database/models/levels';
import { assertNonEmptyString } from '@/utils/assertions.utils';
import { triggerDailyCountUpdatedEvent, triggerLevelsUpdatedEvent } from '@/utils/dashboard.utils';
import Grammar from '@/database/models/grammar';
import { reportInfo } from '@/features/logging/monitoring-handler';
import { supabaseInstance } from '@/config/supabase.config';
import Notes from '../models/notes';

/**
 * Synchronizes shared and user-specific tables with Supabase.
 *
 * @param userId Non-empty user id used for user-specific tables and pending local progress restore.
 * @param fullSync When true, forces all sync tasks to use the epoch start timestamp and refresh local rows.
 * When false, a full sync is selected only after the configured full-sync interval expires.
 * @throws Error when userId is empty or any table sync task fails.
 */
export async function dataSync(userId: string, fullSync: boolean = false): Promise<void> {
  assertNonEmptyString(userId, 'userId');

  await initDbMappings();
  await restoreUnsavedFromLocalStorage(userId);

  // Step 1: Determine if a full sync is needed
  const now = Date.now();
  let doFullSync = fullSync;
  if (!fullSync) {
    const lastFullSync = getFullSyncTime(userId);
    doFullSync = now - lastFullSync > config.sync.fullSyncInterval;
  }

  // Step 2: Perform shared stores data synchronization (grammar and audio metadata)
  const allPromises = doFullSync
    ? [
        Grammar.syncFromRemote(true),
        Levels.syncFromRemote(true),
        Lessons.syncFromRemote(true),
        Notes.syncFromRemote(true),
        UserBlock.syncFromRemote(userId, true),
        UserScoreType.syncFromRemote(userId, true),
        UserItem.syncFromRemote(userId, true),
      ]
    : [
        Grammar.syncFromRemote(false),
        Levels.syncFromRemote(false),
        Lessons.syncFromRemote(false),
        Notes.syncFromRemote(false),
        UserBlock.syncFromRemote(userId, false),
        UserScoreType.syncFromRemote(userId, false),
        UserItem.syncFromRemote(userId, false),
      ];

  // Keep a parallel list of human-readable table names to report per-table completions.
  const tableNames = ['Grammar', 'Levels', 'Lessons', 'Notes', 'UserBlocks', 'UserScores', 'UserItems'];

  const results = await Promise.allSettled(allPromises);

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

  const summary = await withSettledSummary(allPromises, 'Data sync', 3, false);

  triggerDailyCountUpdatedEvent(userId);
  triggerLevelsUpdatedEvent(userId);
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
 * @param userId User id whose user_blocks, user_scores, and user_items rows should sync.
 * @returns Resolves without syncing when there is no active Supabase session.
 * @throws Error when at least one unmount sync task rejects.
 */
export async function dataSyncOnUnmount(userId: string): Promise<void> {
  const { data: sessionData } = await supabaseInstance.auth.getSession();
  if (!sessionData.session) {
    return;
  }

  const results = await Promise.allSettled([
    UserBlock.syncFromRemote(userId, false),
    UserScoreType.syncFromRemote(userId, false),
    UserItem.syncFromRemote(userId, false),
  ]);

  if (results.some((r) => r.status === 'rejected')) {
    throw new Error('Unmount synchronization failed');
  }
}

