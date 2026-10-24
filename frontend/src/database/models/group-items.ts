import Dexie from 'dexie';
import { db } from '@/database/models/db';
import type { GroupItemType } from '@/types/table.types';
import { TableName } from '@/types/table.types';
import SyncEntityModel from './sync-entity-model';

export default class GroupItem extends SyncEntityModel implements GroupItemType {
  id!: number;
  group_id!: number;
  item_id!: number;
  sort_order!: number;
  updated_at!: string;
  deleted_at!: string | null;

  static override readonly syncTable = db.group_items as Dexie.Table<GroupItemType, number>;
  static override readonly syncTableName = TableName.GroupItems;
  static override readonly syncEntityName = 'group items';
  static override readonly syncSelect = 'id, group_id, item_id, sort_order, updated_at, deleted_at';
}
