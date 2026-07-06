import { db } from '@/database/models/db';
import { type NoteType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';

/**
 * Shared note lookup model.
 *
 * Public API:
 * - `getById` resolves optional note references and returns null when missing locally.
 * - `syncFromRemote` is inherited from `SyncEntityModel`.
 */
export default class Notes extends SyncEntityModel implements NoteType {
  id!: number;
  name!: string;
  note!: string;
  sort_order!: number;
  deleted_at!: string | null;

  static override readonly syncTable = db.notes as Dexie.Table<NoteType, number>;
  static override readonly syncTableName = TableName.Notes;
  static override readonly syncEntityName = 'notes';
  static override readonly syncSelect = 'id, name, note, sort_order, deleted_at';

  /**
   * Looks up a local note by id.
   *
   * @param id Note id from a grammar, block, or item reference.
   * @returns The matching note, or null when the local table has no row for the id.
   */
  static async getById(id: number): Promise<NoteType | null> {
    return (await db.notes.get(id)) ?? null;
  }
}
