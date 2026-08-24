import { db } from '@/database/models/db';
import SyncEntityModel from '@/database/models/sync-entity-model';
import type { BlockType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import Dexie from 'dexie';

/** Shared metadata for explicit initial-training blocks. */
export default class Block extends SyncEntityModel implements BlockType {
  id!: number;
  name!: string;
  note!: string | null;
  lesson_id!: number;
  grammar_chunk_id!: number | null;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.blocks as Dexie.Table<BlockType, number>;
  static override readonly syncTableName = TableName.Blocks;
  static override readonly syncEntityName = 'blocks';
  static override readonly syncSelect =
    'id, name, note, lesson_id, grammar_chunk_id, updated_at, deleted_at';

  static async getById(blockId: number): Promise<BlockType | null> {
    return (await db.blocks.get(blockId)) ?? null;
  }
}
