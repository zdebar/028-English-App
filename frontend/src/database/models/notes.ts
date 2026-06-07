import { db } from '@/database/models/db';
import { type NoteType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';
import SyncEntityModel from './sync-entity-model';

/**
 * Represents a note entity in the local database.
 * Handles synchronization of note data between the remote Supabase server and local storage.
 *
 * @method getById - Retrieves a note by its ID from the local database.
 * @method syncFromRemote - Synchronizes notes from the remote server with the local database.
 *
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
   * Retrieves a note by its ID from the database.
   */
  static async getById(id: number): Promise<NoteType | null> {
    return (await db.notes.get(id)) ?? null;
  }
}
