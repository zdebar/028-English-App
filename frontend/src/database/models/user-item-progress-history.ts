import config from '@/config/config';
import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import type { PracticeDirection, UserItemProgressHistoryType } from '@/types/user-item.types';
import { TableName } from '@/types/table.types';
import {
  assertInteger,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertShortDateString,
} from '@/utils/assertions.utils';
import { SupabaseError } from '@/types/error.types';
import { Entity } from 'dexie';
import { getSyncTimestamps, splitDeleted } from '../utils/sync-generic.utils';
import Metadata from './metadata';
import { reportInfo } from '@/features/logging/monitoring-handler';

const NULL_DATE = config.database.nullReplacementDate;

/** Stores one effective progress snapshot and its daily change per item and direction. */
export default class UserItemProgressHistory
  extends Entity<AppDB>
  implements UserItemProgressHistoryType
{
  user_id!: string;
  date!: string;
  item_id!: number;
  direction!: PracticeDirection;
  progress!: number;
  max_progress!: number;
  progress_change!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static async recordChange(
    userId: string,
    itemId: number,
    direction: PracticeDirection,
    progress: number,
    maxProgress: number,
    progressChange: number,
    dateTime: string,
  ): Promise<void> {
    assertNonEmptyString(userId, 'userId');
    assertNonNegativeInteger(itemId, 'itemId');
    assertNonNegativeInteger(progress, 'progress');
    assertNonNegativeInteger(maxProgress, 'maxProgress');
    assertInteger(progressChange, 'progressChange', Number.MIN_SAFE_INTEGER);

    const date = new Date(dateTime).toLocaleDateString('en-CA');
    const key = [userId, date, itemId, direction] as const;
    const existing = await db.user_item_progress_history.get(key);
    await db.user_item_progress_history.put({
      user_id: userId,
      date,
      item_id: itemId,
      direction,
      progress,
      max_progress: maxProgress,
      progress_change: (existing?.progress_change ?? 0) + progressChange,
      updated_at: dateTime,
      deleted_at: null,
    });
  }

  static async getTodayProgressChange(userId: string, date: string): Promise<number> {
    const records = await this.getByDate(userId, date);
    return records.reduce((total, record) => total + record.progress_change, 0);
  }

  static async getByDate(userId: string, date: string): Promise<UserItemProgressHistoryType[]> {
    assertNonEmptyString(userId, 'userId');
    assertShortDateString(date);
    const records = await db.user_item_progress_history
      .where('[user_id+date]')
      .equals([userId, date])
      .toArray();
    return records
      .filter((record) => record.deleted_at == null || record.deleted_at === NULL_DATE)
      .sort(
        (left, right) =>
          left.item_id - right.item_id || left.direction.localeCompare(right.direction),
      );
  }

  static async getByUserId(userId: string): Promise<UserItemProgressHistoryType[]> {
    assertNonEmptyString(userId, 'userId');
    const records = await db.user_item_progress_history.where('user_id').equals(userId).toArray();
    return records
      .filter((record) => record.deleted_at == null || record.deleted_at === NULL_DATE)
      .sort((left, right) => right.date.localeCompare(left.date) || left.item_id - right.item_id);
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await db.user_item_progress_history.where('user_id').equals(userId).delete();
  }

  static async syncFromRemote(userId: string, doFullSync: boolean = false): Promise<number> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.UserItemProgressHistory,
      userId,
    );
    const localRecords = await db.user_item_progress_history
      .where('[user_id+updated_at]')
      .between([userId, lastSyncedAt], [userId, newSyncedAt], true, false)
      .toArray();
    reportInfo(`Completed ${localRecords.length} UserItemProgressHistory push to remote`);

    const updatedRecords = await this.syncWithRemote(userId, localRecords, lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(updatedRecords);
    await db.transaction('rw', db.user_item_progress_history, db.metadata, async () => {
      if (doFullSync) {
        await this.deleteByUserId(userId);
      } else if (toDelete.length > 0) {
        await db.user_item_progress_history.bulkDelete(
          toDelete.map((record) => [record.user_id, record.date, record.item_id, record.direction]),
        );
      }
      if (toUpsert.length > 0) await db.user_item_progress_history.bulkPut(toUpsert);
      await Metadata.markAsSynced(TableName.UserItemProgressHistory, newSyncedAt, userId);
    });
    return updatedRecords.length;
  }

  private static async syncWithRemote(
    userId: string,
    records: UserItemProgressHistoryType[],
    lastSyncedAt: string,
  ): Promise<UserItemProgressHistoryType[]> {
    const { data, error } = await supabaseInstance.rpc('upsert_fetch_user_item_progress_history', {
      p_user_id: userId,
      p_last_synced_at: lastSyncedAt,
      p_user_item_progress_history: records,
    });
    if (error) {
      throw new SupabaseError('Error fetching user item progress history from Supabase.', error, {
        historyCount: records.length,
        lastSyncedAt,
      });
    }
    return data ?? [];
  }
}
