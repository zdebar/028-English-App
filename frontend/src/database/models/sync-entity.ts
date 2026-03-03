import config from '@/config/config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import { TableName } from '@/types/local.types';
import Dexie, { Entity } from 'dexie';
import { splitDeleted } from '../utils/data-sync.utils';
import Metadata from './metadata';

export abstract class SyncEntity<T> extends Entity<AppDB> {
  abstract tableName: TableName;
  abstract dbTable: Dexie.Table<T, any>;
  abstract fetchRemote(lastSyncedAt: string): Promise<T[]>;

  static async getAll(dbTable: Dexie.Table<any, any>, sortField: string) {
    return await dbTable.orderBy(sortField).toArray();
  }

  async sync(doFullSync: boolean = false) {
    const lastSyncedAt = doFullSync
      ? config.database.epochStartDate
      : await Metadata.getSyncedAt(this.tableName);
    const newSyncedAt = new Date().toISOString();

    const records = await this.fetchRemote(lastSyncedAt);
    const { toUpsert, toDelete } = splitDeleted(records);

    await db.transaction('rw', this.dbTable, db.metadata, async () => {
      if (doFullSync) {
        await this.dbTable.clear();
      } else if (toDelete.length > 0) {
        await this.dbTable.bulkDelete(toDelete.map((item: any) => item.id));
      }
      if (toUpsert.length > 0) {
        await this.dbTable.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(this.tableName, newSyncedAt);
    });
  }
}
