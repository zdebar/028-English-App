import { db } from '@/database/models/db';
import { type LessonType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';

/**
 * Shared lesson lookup model.
 *
 * Public API:
 * - `getAll` returns all local lessons for consumers to order as needed.
 * - `syncFromRemote` is inherited from `SyncEntityModel`.
 */
export default class Lessons extends SyncEntityModel implements LessonType {
  id!: number;
  name!: string;
  note!: string | null;
  sort_order!: number;
  level_id!: number;
  group_id!: number | null;
  deleted_at!: string | null;

  static override readonly syncTable = db.lessons as Dexie.Table<LessonType, number>;
  static override readonly syncTableName = TableName.Lessons;
  static override readonly syncEntityName = 'lessons';
  static override readonly syncSelect = 'id, name, note, level_id, sort_order, deleted_at, group_id';

  /**
   * Reads all local lessons without applying an order.
   *
   * @returns All local lesson records.
   */
  static getAll(): Promise<LessonType[]> {
    return db.lessons.toArray();
  }

  /** Returns a local lesson by id, or null when it is missing. */
  static async getById(lessonId: number): Promise<LessonType | null> {
    return (await db.lessons.get(lessonId)) ?? null;
  }
}
