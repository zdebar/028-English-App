import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import Metadata from '@/database/models/metadata';
import { getSyncTimestamps, splitDeleted } from '@/database/utils/sync-generic.utils';
import { SupabaseError } from '@/types/error.types';
import type { PronunciationGroupItemType } from '@/types/pronunciation.types';
import { TableName } from '@/types/table.types';
import { Entity } from 'dexie';

export default class PronunciationGroupItem
  extends Entity<AppDB>
  implements PronunciationGroupItemType
{
  pronunciation_group_id!: number;
  item_id!: number;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static async syncFromRemote(doFullSync: boolean = false): Promise<number> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.PronunciationGroupItems,
    );
    const { data, error } = await supabaseInstance
      .from(TableName.PronunciationGroupItems)
      .select(
        'pronunciation_group_id, item_id, sort_order, updated_at, deleted_at',
      )
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError(
        'Failed to fetch pronunciation group items from supabase',
        error,
        { lastSyncedAt },
      );
    }

    const remoteItems = (data as unknown as PronunciationGroupItemType[] | null) ?? [];
    const { toUpsert, toDelete } = splitDeleted(remoteItems);

    await db.transaction('rw', db.pronunciation_group_items, db.metadata, async () => {
      if (doFullSync) {
        await db.pronunciation_group_items.clear();
      } else if (toDelete.length > 0) {
        await db.pronunciation_group_items.bulkDelete(
          toDelete.map((item) => [item.pronunciation_group_id, item.item_id]),
        );
      }
      if (toUpsert.length > 0) {
        await db.pronunciation_group_items.bulkPut(toUpsert);
      }
      await Metadata.markAsSynced(TableName.PronunciationGroupItems, newSyncedAt);
    });

    return remoteItems.length;
  }
}
