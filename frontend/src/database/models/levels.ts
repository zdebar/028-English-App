import { db } from '@/database/models/db';
import type { LevelType, LevelOverviewType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import { aggregateLevels } from '../utils/levels.utils';
import UserItem from './user-items';
import Lessons from './lessons';
import SyncEntityModel from './sync-entity-model';

/**
 * Shared level lookup model.
 *
 * Public API:
 * - `getOverview` combines local levels, lessons, and user items into dashboard progress summaries.
 * - `syncFromRemote` is inherited from `SyncEntityModel`.
 */
export default class Levels extends SyncEntityModel implements LevelType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.levels as Dexie.Table<LevelType, number>;
  static override readonly syncTableName = TableName.Levels;
  static override readonly syncEntityName = 'levels';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  /**
   * Builds a level overview with lesson progress for a user.
   *
   * @param userId User id whose practice items should be aggregated.
   * @param localDate Local date used for started/mastered-today counts.
   * @returns Level summaries with nested lessons; levels without lesson items are omitted.
   */
  static async getOverview(userId: string, localDate: string): Promise<LevelOverviewType[]> {
    return db.transaction('r', db.user_items, db.lessons, db.levels, async () => {
      const [items, lessons, levels] = await Promise.all([
        UserItem.getByUserId(userId),
        Lessons.getAll(),
        db.levels.orderBy('sort_order').toArray(),
      ]);
      return aggregateLevels(items, lessons, levels, localDate);
    });
  }
}
