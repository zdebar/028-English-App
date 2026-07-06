import { db } from '@/database/models/db';
import { type LessonType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';

/**
 * Shared lesson lookup model.
 *
 * Public API:
 * - `getAll` returns local lessons in display order.
 * - `syncFromRemote` is inherited from `SyncEntityModel`.
 */
export default class Lessons extends SyncEntityModel implements LessonType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  level_id!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.lessons as Dexie.Table<LessonType, number>;
  static override readonly syncTableName = TableName.Lessons;
  static override readonly syncEntityName = 'lessons';
  static override readonly syncSelect = 'id, name, note, level_id, sort_order, deleted_at';

  /**
   * Reads all local lessons in display order.
   *
   * @returns Lesson records ordered by sort_order.
   */
  static async getAll(): Promise<LessonType[]> {
    return await db.lessons.orderBy('sort_order').toArray();
  }
}
