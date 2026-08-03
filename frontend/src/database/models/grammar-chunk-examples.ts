import { supabaseInstance } from '@/config/supabase.config';
import type AppDB from '@/database/models/app-db';
import { db } from '@/database/models/db';
import Metadata from '@/database/models/metadata';
import { getSyncTimestamps, splitDeleted } from '@/database/utils/sync-generic.utils';
import type { GrammarChunkExampleType } from '@/types/generic.types';
import { TableName } from '@/types/table.types';
import { SupabaseError } from '@/types/error.types';
import { Entity } from 'dexie';

export default class GrammarChunkExample
  extends Entity<AppDB>
  implements GrammarChunkExampleType
{
  grammar_chunk_id!: number;
  item_id!: number;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static async syncFromRemote(doFullSync: boolean = false): Promise<number> {
    const { lastSyncedAt, newSyncedAt } = await getSyncTimestamps(
      doFullSync,
      TableName.GrammarChunkExamples,
    );
    const { data, error } = await supabaseInstance
      .from(TableName.GrammarChunkExamples)
      .select('grammar_chunk_id, item_id, sort_order, updated_at, deleted_at')
      .gt('updated_at', lastSyncedAt);

    if (error) {
      throw new SupabaseError('Failed to fetch grammar chunk examples from supabase', error, {
        lastSyncedAt,
      });
    }

    const remoteItems = (data as unknown as GrammarChunkExampleType[] | null) ?? [];
    const { toUpsert, toDelete } = splitDeleted(remoteItems);

    await db.transaction('rw', db.grammar_chunk_examples, db.metadata, async () => {
      if (doFullSync) await db.grammar_chunk_examples.clear();
      else if (toDelete.length > 0) {
        await db.grammar_chunk_examples.bulkDelete(
          toDelete.map((item) => [item.grammar_chunk_id, item.item_id]),
        );
      }
      if (toUpsert.length > 0) await db.grammar_chunk_examples.bulkPut(toUpsert);
      await Metadata.markAsSynced(TableName.GrammarChunkExamples, newSyncedAt);
    });

    return remoteItems.length;
  }
}
