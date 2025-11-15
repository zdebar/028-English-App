import { Entity } from "dexie";
import type AppDB from "@/database/models/app-db";
import { db } from "@/database/models/db";
import type { UUID } from "crypto";
import type { TableName } from "@/types/local.types";

export default class Metadata extends Entity<AppDB> {
  table_name!: TableName;
  synced_at?: string;
  user_id?: UUID;

  /**
   * Gets the last synced date for a table and user.
   * @param tableName the name of the table
   * @param userId the ID of the user (optional)
   * @returns the synced_at date or first epoch date if not found
   * @throws Error if there is an issue fetching the metadata
   */
  static async getSyncedDate(
    tableName: TableName,
    userId?: UUID
  ): Promise<string> {
    const metadata = userId
      ? await db.metadata.get({ table_name: tableName, user_id: userId })
      : await db.metadata.get(tableName);

    return metadata?.synced_at || "1970-01-01T00:00:00.000Z";
  }

  /**
   * Marks a table as synced by storing its metadata.
   * @param tableName the name of the synced table
   * @param syncTime optional sync time (e.g., from the server). Defaults to now.
   * @param userId the ID of the user (optional), will store undefined if not provided
   * @returns true if the operation was successful, otherwise false
   * @throws Error if there is an issue saving the metadata
   */
  static async markAsSynced(
    tableName: TableName,
    userId?: UUID,
    syncTime?: string
  ): Promise<boolean> {
    const syncedAt = syncTime || new Date().toISOString();
    await db.metadata.put({
      table_name: tableName,
      synced_at: syncedAt,
      ...(userId && { user_id: userId }),
    });
    return !!syncedAt;
  }
}
